import { For, Show, JSXElement } from "solid-js";
import SortAscIcon from "~icons/mdi/sort-ascending";
import SortDescIcon from "~icons/mdi/sort-descending";
import SortIcon from "~icons/mdi/sort";
import type { DataTableProps, ColumnDefinition } from "../../types";
import styles from "./DataTable.module.scss";

export function DataTable<T extends Record<string, unknown>>(
	props: DataTableProps<T>
): JSXElement {
	const getSortIcon = (column: string): JSXElement => {
		if (props.sortState.column !== column) {
			return <SortIcon class={styles["sort-icon-inactive"]} />;
		}
		if (props.sortState.direction === "asc") {
			return <SortDescIcon class={styles["sort-icon-active"]} />;
		}
		if (props.sortState.direction === "desc") {
			return <SortAscIcon class={styles["sort-icon-active"]} />;
		}
		return <SortIcon class={styles["sort-icon-inactive"]} />;
	};

	const handleHeaderClick = (col: ColumnDefinition<T>): void => {
		if (col.sortable !== false) {
			props.onSortChange(col.key as string);
		}
	};

	const getCellValue = (
		row: T,
		col: ColumnDefinition<T>,
		index: number
	): JSXElement | string | number | null => {
		const value = row[col.key as keyof T];
		if (col.render) {
			return col.render(value, row, index);
		}
		if (value === null || value === undefined) {
			return "-";
		}
		if (typeof value === "boolean") {
			return value ? "Yes" : "No";
		}
		return String(value);
	};

	const getHeaderClass = (col: ColumnDefinition<T>) => {
		const classes = [styles["table-header"]];
		if (col.sortable !== false) {
			classes.push(styles["sortable-header"]);
		}
		if (col.className) {
			classes.push(col.className);
		}
		return classes.join(" ");
	};

	const getHeaderStyle = (col: ColumnDefinition<T>) => {
		const style: Record<string, string> = {};
		if (col.width) style.width = col.width;
		if (col.align) style["text-align"] = col.align;
		return style;
	};

	const getCellStyle = (col: ColumnDefinition<T>) => {
		const style: Record<string, string> = {};
		if (col.align) style["text-align"] = col.align;
		return style;
	};

	return (
		<div class={styles["table-container"]}>
			<table class={styles["data-table"]}>
				<thead>
					<tr>
						<For each={props.columns}>
							{(col) => (
								<th
									class={getHeaderClass(col)}
									style={getHeaderStyle(col)}
									onClick={() => handleHeaderClick(col)}
								>
									<span>{col.label}</span>
									<Show when={col.sortable !== false}>
										{getSortIcon(col.key as string)}
									</Show>
								</th>
							)}
						</For>
					</tr>
				</thead>
				<tbody>
					<Show
						when={props.data.length > 0}
						fallback={
							<tr>
								<td colspan={props.columns.length} class={styles["empty-row"]}>
									No data available
								</td>
							</tr>
						}
					>
						<For each={props.data}>
							{(row, index) => (
								<tr class={props.rowClass?.(row) || ""}>
									<For each={props.columns}>
										{(col) => (
											<td
												class={col.className || ""}
												style={getCellStyle(col)}
											>
												{getCellValue(row, col, index())}
											</td>
										)}
									</For>
								</tr>
							)}
						</For>
					</Show>
				</tbody>
			</table>
		</div>
	);
}

export default DataTable;

