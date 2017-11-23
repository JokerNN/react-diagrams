import {
	DiagramEngine,
	DefaultNodeFactory,
	DefaultLinkFactory,
	DiagramModel,
	DefaultNodeModel,
	LinkModel,
	DefaultPortModel,
	DiagramWidget,
  DefaultLinkWidget,
  PointModel
} from "../../src/main";
import * as React from "react";


export interface DefaultLinkProps {
	color?: string;
	width?: number;
	link: LinkModel;
	smooth?: boolean;
	diagramEngine: DiagramEngine;
	pointAdded?: (point: PointModel, event) => any;
}

export interface DefaultLinkState {
	selected: boolean;
}

class OrtogonalLinkWidget extends React.Component<DefaultLinkProps, DefaultLinkState> {
  constructor(props: DefaultLinkProps) {
    super(props);
    this.state = {
      selected: false
    }
  }

  generateLink(extraProps: any, id: string | number): JSX.Element {
		var Bottom = (
			<path
				className={this.state.selected || this.props.link.isSelected() ? "selected" : ""}
				strokeWidth={this.props.width}
				stroke={this.props.color}
				{...extraProps}
			/>
		);

		var Top = (
			<path
				strokeLinecap="round"
				onMouseLeave={() => {
					this.setState({ selected: false });
				}}
				onMouseEnter={() => {
					this.setState({ selected: true });
				}}
				data-linkid={this.props.link.getID()}
				stroke={this.props.color}
				strokeOpacity={this.state.selected ? 0.1 : 0}
				strokeWidth={20}
				onContextMenu={() => {
					if (!this.props.diagramEngine.isModelLocked(this.props.link)) {
						event.preventDefault();
						this.props.link.remove();
					}
				}}
				{...extraProps}
			/>
		);

		return (
			<g key={"link-" + id}>
				{Bottom}
				{Top}
			</g>
		);
	}

  generateLinePath(firstPoint: PointModel, lastPoint: PointModel): string {
		return `M${firstPoint.x},${firstPoint.y} L ${lastPoint.x},${lastPoint.y}`;
	}

  render() {
    //debugger;
    const linkModel = this.props.link;
    const[fromPoint, toPoint] = linkModel.points;
    const diff = Math.abs(fromPoint.x - toPoint.x) / 2;
    let middleX;
    if (fromPoint.x > toPoint.x) {
      middleX = toPoint.x + diff;
    } else {
      middleX = fromPoint.x + diff;
    }

    const points = [
      fromPoint,
      new PointModel(linkModel, {x: middleX, y: fromPoint.y}),
      new PointModel(linkModel, {x: middleX, y: toPoint.y}),
      toPoint
    ];
    let ds = [];

    for (var i = 0; i < points.length - 1; i++) {
      ds.push(this.generateLinePath(points[i], points[i + 1]));
    }

    const link = this.generateLink({
      "data-linkid": this.props.link.id,
      "data-point": 0,
      onMouseDown: () => {},
      "d": this.generateLinePath(linkModel.points[0], linkModel.points[1])
    }, 0);

    const paths = ds.map((data, index) => {
      return this.generateLink(
        {
          "data-linkid": this.props.link.id,
          "data-point": index,
          "onMouseDown": (event: MouseEvent) => {},
          "d": data
        },
        index
      );
    });

    return (
      <g>{paths}</g>
    );
  }
}


class OrtogonalLinkFactory extends DefaultLinkFactory {
  generateReactWidget(diagramEngine: DiagramEngine, link: LinkModel): JSX.Element {
    return <OrtogonalLinkWidget link={link} diagramEngine={diagramEngine} />;
  }
}

export default () => {
	//1) setup the diagram engine
	var engine = new DiagramEngine();
	engine.registerNodeFactory(new DefaultNodeFactory());
	engine.registerLinkFactory(new OrtogonalLinkFactory());

	//2) setup the diagram model
	var model = new DiagramModel();

	//3-A) create a default node
	var node1 = new DefaultNodeModel("Node 1", "rgb(0,192,255)");
	var port1 = node1.addPort(new DefaultPortModel(false, "out-1", "Out"));
	node1.x = 100;
	node1.y = 100;

	//3-B) create another default node
	var node2 = new DefaultNodeModel("Node 2", "rgb(192,255,0)");
	var port2 = node2.addPort(new DefaultPortModel(true, "in-1", "IN"));
	node2.x = 400;
	node2.y = 100;

	//3-C) link the 2 nodes together
	var link1 = new LinkModel();
	link1.setSourcePort(port1);
	link1.setTargetPort(port2);

	//4) add the models to the root graph
	model.addNode(node1);
	model.addNode(node2);
	model.addLink(link1);

	//5) load model into engine
	engine.setDiagramModel(model);

	//6) render the diagram!
	return <DiagramWidget diagramEngine={engine} />;
};
