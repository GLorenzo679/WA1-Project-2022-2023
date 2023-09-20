import dayjs from "dayjs";

import { useEffect, useState, useContext } from "react";
import { Form, Button, ListGroup, ListGroupItem, Row, Col, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import API from "../API";
import MessageContext from "../contexts/messageCtx";

const PageForm = (props) => {
	const { handleErrors } = useContext(MessageContext);
	const [author, setAuthor] = useState(props.page ? props.page.authorName : props.user.name + " " + props.user.surname);
	const [title, setTitle] = useState(props.page ? props.page.title : "");
	const creationDate = props.page ? dayjs(props.page.creationDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
	const [publicationDate, setPublicationDate] = useState(
		props.page && props.page.publicationDate ? props.page.publicationDate.format("YYYY-MM-DD") : ""
	);
	const [users, setUsers] = useState([]);

	const handleSubmit = (event) => {
		event.preventDefault();

		const page = {
			title: title.trim(),
			authorName: author.trim(),
			creationDate: creationDate,
			publicationDate: publicationDate != "" ? dayjs(publicationDate).format("YYYY-MM-DD") : null,
		};

		const countHeader = props.content.map((c) => c.type).filter((t) => t === 0).length;
		const countParagraphImage = props.content.map((c) => c.type).filter((t) => t !== 0).length;

		// count the number of types of content
		if (countHeader > 0 && countParagraphImage > 0) {
			if (props.page) {
				page.id = props.page.id;
				props.editPage(page, props.content);
			} else {
				props.addPage(page, [...props.content]);
			}
		} else {
			handleErrors({ error: "You must have at least one header and one paragraph or image in a page" });
		}
	};

	useEffect(() => {
		const getUsernames = async () => {
			const response = await API.getUsers();
			const users = await response;
			setUsers(users);
		};

		getUsernames();
	}, []);

	return (
		<>
			<Form className="block-example border rounded mb-0 form-padding" onSubmit={handleSubmit}>
				<Form.Group className="mb-3">
					<Form.Label>Title</Form.Label>
					<Form.Control type="text" required={true} value={title} onChange={(event) => setTitle(event.target.value)} />
				</Form.Group>
				<Form.Group className="mb-3">
					<Form.Label>Author</Form.Label>
					<Form.Select
						type="text"
						value={author}
						required={true}
						disabled={!props.admin}
						onChange={(event) => {
							setAuthor(event.target.value);
						}}
					>
						{props.admin ? (
							users.map((user) => {
								return (
									<option key={user.id} value={user.name + " " + user.surname}>
										{user.name + " " + user.surname}
									</option>
								);
							})
						) : (
							<option>{author}</option>
						)}
					</Form.Select>
				</Form.Group>
				<Form.Group className="mb-3">
					<Form.Label>Creation Date</Form.Label>
					<Form.Control
						type="date"
						value={props.page ? props.page.creationDate.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD")}
						disabled
					/>
				</Form.Group>
				<Form.Group className="mb-3">
					<Form.Label>Publication Date</Form.Label>
					<Form.Control
						type="date"
						min={
							props.page && props.page.publicationDate
								? props.page.publicationDate.format("YYYY-MM-DD")
								: dayjs().format("YYYY-MM-DD")
						}
						value={publicationDate}
						onChange={(event) => setPublicationDate(event.target.value)}
					/>
				</Form.Group>
				<Content pageId={props.page ? props.page.id : null} contents={props.content} setContents={props.setContent} />
				<Button className="mb-3" variant="primary" type="submit">
					Save
				</Button>
				&nbsp;
				<Link className="btn btn-danger mb-3" to={"/back-office"}>
					Cancel
				</Link>
			</Form>
		</>
	);
};

function Content(props) {
	const { handleErrors } = useContext(MessageContext);

	const editContent = (cid, newContent) => {
		const newContents = props.contents.map((content) => {
			if (content.id === cid) {
				return newContent;
			} else return content;
		});
		props.setContents(newContents);
	};

	const changePosition = (index, direction) => {
		let newContents = [...props.contents];

		if (direction === "up") {
			const oldElement = newContents[index - 1];
			newContents.splice(index - 1, 1, newContents[index]);
			newContents.splice(index, 1, oldElement);
		} else {
			const oldElement = newContents[index + 1];
			newContents.splice(index + 1, 1, newContents[index]);
			newContents.splice(index, 1, oldElement);
		}

		props.setContents(newContents);
	};

	const addContentRow = () => {
		const newContent = {
			//fake id, only used as key in ListGroupItem
			id: props.contents.length != 0 ? [...props.contents].sort((a, b) => (a.id < b.id ? 1 : -1))[0].id + 1 : 0,
			type: 0,
			data: "",
			position: props.contents.length,
		};

		props.setContents([...props.contents, newContent]);
	};

	const deleteContentRow = (index) => {
		const type = props.contents[index].type;
		const countHeader = props.contents.map((c) => c.type).filter((t) => t === 0).length;
		const countParagraphImage = props.contents.map((c) => c.type).filter((t) => t !== 0).length;

		if ((type === 0 && countHeader > 1) || (type != 0 && countParagraphImage > 1)) {
			const newContents = [...props.contents];
			newContents.splice(index, 1);
			props.setContents(newContents);
		} else {
			handleErrors({ error: "You must have at least one header and one paragraph or image in a page" });
		}
	};

	return (
		<ListGroup className="mb-3">
			{props.contents.length != 0 &&
				props.contents.map((item) => {
					return (
						<ListGroupItem key={item.id} className="d-flex align-items-center">
							<ContentRow
								numContents={props.contents.length}
								content={item}
								index={props.contents.indexOf(item)}
								editContent={editContent}
								changePosition={changePosition}
								deleteContentRow={deleteContentRow}
							/>
						</ListGroupItem>
					);
				})}
			<ListGroupItem className="d-flex align-items-center">
				<Button variant="primary" onClick={() => addContentRow()}>
					<b> + Add Content Block </b>
				</Button>
			</ListGroupItem>
		</ListGroup>
	);
}

function ContentRow(props) {
	const [type, setType] = useState(props.content.type);
	const [data, setData] = useState(props.content.data);

	const contentType = {
		0: { formPlaceholder: "Header", formType: "text" },
		1: { formPlaceholder: "Paragraph", formType: "text" },
		2: { formPlaceholder: "Image", formType: "file" },
	};

	const typeMap = { Header: 0, Paragraph: 1, Image: 2 };

	useEffect(() => {
		const handleEdit = () => {
			const newContent = {
				id: props.content.id,
				type: type,
				data: data,
				position: props.content.position,
				pageId: props.content.pageId,
			};

			props.editContent(props.content.id, newContent);
		};

		handleEdit();
	}, [type, data]);

	return (
		<>
			<Form.Group className="mb-3 col-12">
				<Row>
					<Col className="col-1">
						<Container className="mt-3">
							<div className="d-flex justify-content-between">
								<Button
									variant="primary"
									className="btn-sm"
									onClick={() => {
										if (props.index > 0) {
											props.changePosition(props.index, "up");
										}
									}}
								>
									<i className="bi bi-arrow-up"></i>
								</Button>
								<Button
									variant="primary"
									className="btn-sm"
									onClick={() => {
										if (props.index < props.numContents - 1) {
											props.changePosition(props.index, "down");
										}
									}}
								>
									<i className="bi bi-arrow-down"></i>
								</Button>
							</div>
							<div className="mt-2 d-flex justify-content-center">
								<Button
									variant="danger"
									onClick={() => {
										props.deleteContentRow(props.index);
									}}
								>
									<i className="bi bi-trash"></i>
								</Button>
							</div>
						</Container>
					</Col>
					<Col>
						<Row className="mt-2">
							<Col className="col-1">
								<Form.Label>Block Type: </Form.Label>
							</Col>
							<Col className="col-2">
								<Form.Select
									type="text"
									required={true}
									value={contentType[type].formPlaceholder}
									onChange={(event) => {
										setType(typeMap[event.target.value]);
									}}
								>
									<option>Header</option>
									<option>Paragraph</option>
									<option>Image</option>
								</Form.Select>
							</Col>
						</Row>
						<Row className="mt-3">
							<Col className="col-1">
								<Form.Label>Block Data: </Form.Label>
							</Col>
							<Col className={contentType[type].formType != "file" ? "col-11" : "col-4"}>
								{contentType[type].formType == "file" ? (
									<Form.Select
										required={true}
										value={data}
										onChange={(event) => {
											setData(event.target.value);
										}}
									>
										<option value=""></option>
										<option value="react.png">react.png</option>
										<option value="js.png">js.png</option>
										<option value="nodejs.png">nodejs.png</option>
										<option value="bootstrap.png">bootstrap.png</option>
									</Form.Select>
								) : (
									<Form.Control
										value={data}
										as="textarea"
										rows={3}
										type="text"
										required={true}
										onChange={(event) => {
											setData(event.target.value);
										}}
									></Form.Control>
								)}
							</Col>
						</Row>
					</Col>
				</Row>
			</Form.Group>
		</>
	);
}

export default PageForm;
