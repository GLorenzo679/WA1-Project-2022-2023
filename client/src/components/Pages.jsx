import dayjs from "dayjs";

import { React } from "react";
import { Table } from "react-bootstrap/";
import { useLocation, Link } from "react-router-dom";
import { Button } from "react-bootstrap";

function PageTable(props) {
	const pages = props.pages;

	if (pages.length === 0) return <p> There are no pages present</p>;
	else
		return (
			<>
				<h1 className="pb-3">Pages:</h1>
				<Table striped>
					<thead>
						<tr className="text-center">
							{props.office == "Back Office" ? <th></th> : null}
							<th>Title</th>
							<th>Author</th>
							<th>Creation Date</th>
							<th>Publication Date</th>
							{props.office == "Back Office" ? <th>Status</th> : null}
						</tr>
					</thead>
					<tbody>
						{pages.map((page) => (
							<PageRow
								key={page.id}
								admin={props.admin}
								username={props.username}
								pageData={page}
								office={props.office}
								deletePage={props.deletePage}
							/>
						))}
						{props.office == "Back Office" ? (
							<tr>
								<td colSpan="6">
									<Link to="/back-office/add">
										<Button variant="primary">
											<b> + Add Page</b>
										</Button>
									</Link>
								</td>
							</tr>
						) : null}
					</tbody>
				</Table>
			</>
		);
}

function PageRow(props) {
	const canEdit = props.username == props.pageData.authorName || props.admin;

	const formatWatchDate = (dayJsDate, format) => {
		return dayJsDate ? dayJsDate.format(format) : "";
	};

	const location = useLocation();

	const status = props.pageData.publicationDate
		? dayjs().isAfter(dayjs(props.pageData.publicationDate))
			? "Published"
			: "Scheduled"
		: "Draft";

	return (
		<tr className="text-center">
			{props.office == "Back Office" ? (
				<td>
					{canEdit ? (
						<Link
							className="btn btn-primary"
							to={{ pathname: "pages/" + props.pageData.id + "/edit/", state: { nextpage: location.pathname } }}
						>
							<i className="bi bi-pencil-square" />
						</Link>
					) : null}
					&nbsp;
					{canEdit ? (
						<Button
							variant="danger"
							onClick={() => {
								props.deletePage(props.pageData.id);
							}}
						>
							<i className="bi bi-trash"></i>
						</Button>
					) : null}
				</td>
			) : null}
			<td>
				<Link to={"/pages/" + props.pageData.id}>{props.pageData.title}</Link>
			</td>
			<td>
				<p>{props.pageData.authorName}</p>
			</td>
			<td>
				<small>{formatWatchDate(props.pageData.creationDate, "MMMM D, YYYY")}</small>
			</td>
			<td>
				<small>{formatWatchDate(props.pageData.publicationDate, "MMMM D, YYYY")}</small>
			</td>
			{props.office == "Back Office" ? (
				<td>
					<Button
						variant={status == "Draft" ? "danger" : status == "Scheduled" ? "warning" : "success"}
						className="rounded-pill"
						style={{ pointerEvents: "none", userSelect: "none", width: "100px" }}
					>
						{status}
					</Button>
				</td>
			) : null}
		</tr>
	);
}

export default PageTable;
