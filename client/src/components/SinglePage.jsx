import { ListGroup, ListGroupItem } from "react-bootstrap";
import { Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

function PageContent(props) {
	const formatWatchDate = (dayJsDate, format) => {
		return dayJsDate ? dayJsDate.format(format) : "";
	};

	const content = props.content;

	return (
		<>
			<Row className="d-flex align-items-center mx-3">
				<h1>{props.page.title}</h1>
			</Row>
			<Row className="d-flex align-items-center mt-3 mx-3">
				<Col>
					<p style={{ color: "grey" }}>Creation Date: {formatWatchDate(props.page.creationDate, "MMMM D, YYYY")}</p>
				</Col>
				<Col className="mb-2 d-flex justify-content-end">
					<p style={{ color: "grey" }}>Author: {props.page.authorName}</p>
				</Col>
			</Row>
			<Row className="d-flex align-items-center mx-3">
				<Col>
					<p style={{ color: "grey" }}>
						Publication Date: {formatWatchDate(props.page.publicationDate, "MMMM D, YYYY")}
					</p>
				</Col>
			</Row>
			<ListGroup>
				{content.map((item) => {
					return (
						<ListGroupItem key={item.id} className="d-flex align-items-center border-0">
							<ContentData content={item}></ContentData>
						</ListGroupItem>
					);
				})}
			</ListGroup>
			<Row>
				<Col className="col-12 d-flex justify-content-center">
					<Link className="btn btn-lg btn-primary my-3" to={props.office == "Front Office" ? "/" : "/back-office"}>
						<b>Back</b>
					</Link>
				</Col>
			</Row>
		</>
	);
}

function ContentData(props) {
	if (props.content.type === 0) return <h1 style={{ marginLeft: "1rem" }}>{props.content.data}</h1>;
	else if (props.content.type === 1) return <p style={{ marginLeft: "1rem" }}>{props.content.data}</p>;
	else {
		return (
			<img
				style={{ marginLeft: "1rem", maxWidth: "250px" }}
				src={"http://localhost:3001/static/images/" + props.content.data}
			/>
		);
	}
}

export default PageContent;
