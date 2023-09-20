import { React, useState } from "react";
import { Button, Container, Form } from "react-bootstrap";

function WebsiteTitle(props) {
	const [editTitle, setEditTitle] = useState(false);
	const [newTitle, setNewTitle] = useState(props.title);

	function handleEditTitle(event) {
		event.preventDefault();

		props.changeTitle(newTitle);
		setEditTitle(!editTitle);
	}

	return (
		<>
			<h1 className="pb-3">Website Title:</h1>
			<Container className="mb-3 d-flex align-items-center">
				{editTitle ? (
					<Form onSubmit={handleEditTitle}>
						<Form.Group className="d-flex align-items">
							<Button className="d-flex mr-2" variant="success" type="submit">
								<i className="bi bi-check-circle"></i>
							</Button>
							&nbsp;
							<Button className="d-flex mr-2" variant="danger" onClick={() => setEditTitle(!editTitle)}>
								<i className="bi bi-x-circle"></i>
							</Button>
							&nbsp;
							<Form.Control type="text" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} />
						</Form.Group>
					</Form>
				) : (
					<>
						<Button className="d-flex mr-2" variant="primary" onClick={() => setEditTitle(!editTitle)}>
							<i className="bi bi-pencil-square" />
						</Button>
						&nbsp;
						<h2 className="d-flex">{props.title}</h2>
					</>
				)}
			</Container>
		</>
	);
}

export default WebsiteTitle;
