import { For, Show, JSXElement, createSignal, createMemo, onCleanup } from "solid-js";
import SortAscIcon from "~icons/mdi/sort-ascending";
import SortDescIcon from "~icons/mdi/sort-descending";
import SortIcon from "~icons/mdi/sort";
import type { DataTableProps, ColumnDefinition } from "../../types";
import styles from "./DataTable.module.scss";

export function DataTable<T extends Record<string, unknown>>(
	props: DataTableProps<T>
): JSXElement {
	// Resizing state - mutable object to avoid closure issues with event listeners
	let resizeData = { column: "", startX: 0, startWidth: 0 };
	const [resizingColumn, setResizingColumn] = createSignal<string | null>(null);

	// Get visible columns only
	const visibleColumns = createMemo(() =>
		props.columns.filter((col) => props.visibleColumns.includes(col.key as string))
	);

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

	const handleHeaderClick = (col: ColumnDefinition<T>, e: MouseEvent): void => {
		// Prevent sort when clicking on resizer
		if ((e.target as HTMLElement).classList.contains(styles["resizer"])) return;
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
		if (resizingColumn() === col.key) {
			classes.push(styles["resizing"]);
		}
		return classes.join(" ");
	};

	const getHeaderStyle = (col: ColumnDefinition<T>) => {
		const style: Record<string, string> = {};
		const width = props.columnWidths[col.key as string] || col.width;
		if (width) style.width = width;
		if (col.align) style["text-align"] = col.align;
		if (col.minWidth) style["min-width"] = col.minWidth;
		return style;
	};

	const getCellStyle = (col: ColumnDefinition<T>) => {
		const style: Record<string, string> = {};
		if (col.align) style["text-align"] = col.align;
		return style;
	};

	// --- Column Resizing ---
	const handleResizeMove = (e: MouseEvent): void => {
		if (!resizeData.column) return;
		const diff = e.clientX - resizeData.startX;
		const newWidth = Math.max(50, resizeData.startWidth + diff);
		props.onColumnResize?.(resizeData.column, `${newWidth}px`);
	};

	const handleResizeEnd = (): void => {
		resizeData.column = "";
		setResizingColumn(null);
		document.removeEventListener("mousemove", handleResizeMove);
		document.removeEventListener("mouseup", handleResizeEnd);
	};

	const handleResizeStart = (col: ColumnDefinition<T>, e: MouseEvent): void => {
		if (props.allowResize === false || col.resizable === false) return;
		e.preventDefault();
		e.stopPropagation();

		const th = (e.target as HTMLElement).parentElement;
		if (!th) return;

		resizeData = {
			column: col.key as string,
			startX: e.clientX,
			startWidth: th.offsetWidth,
		};
		setResizingColumn(col.key as string);

		document.addEventListener("mousemove", handleResizeMove);
		document.addEventListener("mouseup", handleResizeEnd);
	};

	onCleanup(() => {
		document.removeEventListener("mousemove", handleResizeMove);
		document.removeEventListener("mouseup", handleResizeEnd);
	});

	const isResizable = (col: ColumnDefinition<T>): boolean =>
		props.allowResize !== false && col.resizable !== false;

	return (
		<div class={styles["table-container"]}>
			<table class={styles["data-table"]}>
				<thead>
					<tr>
						<For each={visibleColumns()}>
							{(col) => (
								<th
									class={getHeaderClass(col)}
									style={getHeaderStyle(col)}
									onClick={(e) => handleHeaderClick(col, e)}
								>
									<div class={styles["header-content"]}>
										<span>{col.label}</span>
										<Show when={col.sortable !== false}>
											{getSortIcon(col.key as string)}
										</Show>
									</div>
									<Show when={isResizable(col)}>
										<div
											class={styles["resizer"]}
											onMouseDown={(e) => handleResizeStart(col, e)}
										/>
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
								<td colspan={visibleColumns().length} class={styles["empty-row"]}>
									No data available
								</td>
							</tr>
						}
					>
						<For each={props.data}>
							{(row, index) => (
								<tr class={props.rowClass?.(row) || ""}>
									<For each={visibleColumns()}>
										{(col) => (
											<td class={col.className || ""} style={getCellStyle(col)}>
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

