import { For, Show, JSXElement, createSignal, createMemo, onCleanup } from "solid-js";
import SortAscIcon from "~icons/mdi/sort-ascending";
import SortDescIcon from "~icons/mdi/sort-descending";
import SortIcon from "~icons/mdi/sort";
import type { DataTableProps, ColumnDefinition } from "../types";
import styles from "./DataTable.module.scss";

interface ResizeData {
	leftColumn: string;
	rightColumn: string;
	startX: number;
	leftStartWidth: number;
	rightStartWidth: number;
	minWidth: number;
}

export function DataTable<T extends Record<string, unknown>>(
	props: DataTableProps<T>
): JSXElement {
	// Resizing state - mutable object to avoid closure issues with event listeners
	let resizeData: ResizeData | null = null;
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
		if (!resizeData) return;

		const { leftColumn, rightColumn, startX, leftStartWidth, rightStartWidth, minWidth } = resizeData;
		const diff = e.clientX - startX;

		// Only update if there's actual movement
		if (diff === 0) return;

		// Calculate new widths - left column grows/shrinks, right column does opposite
		const totalWidth = leftStartWidth + rightStartWidth;
		let newLeftWidth = leftStartWidth + diff;
		let newRightWidth = rightStartWidth - diff;

		// Enforce minimum widths
		if (newLeftWidth < minWidth) {
			newLeftWidth = minWidth;
			newRightWidth = totalWidth - minWidth;
		}
		if (newRightWidth < minWidth) {
			newRightWidth = minWidth;
			newLeftWidth = totalWidth - minWidth;
		}

		// Update both columns
		props.onColumnResize?.(leftColumn, `${newLeftWidth}px`);
		props.onColumnResize?.(rightColumn, `${newRightWidth}px`);
	};

	const handleResizeEnd = (): void => {
		resizeData = null;
		setResizingColumn(null);
		document.removeEventListener("mousemove", handleResizeMove);
		document.removeEventListener("mouseup", handleResizeEnd);
	};

	const handleResizeStart = (colIndex: number, e: MouseEvent): void => {
		const cols = visibleColumns();
		const leftCol = cols[colIndex];
		const rightCol = cols[colIndex + 1];

		if (props.allowResize === false || !leftCol || !rightCol) return;
		if (leftCol.resizable === false || rightCol.resizable === false) return;

		e.preventDefault();
		e.stopPropagation();

		const th = (e.target as HTMLElement).parentElement;
		const nextTh = th?.nextElementSibling as HTMLElement;
		if (!th || !nextTh) return;

		const minWidth = 50;

		// Lock ALL column widths to their current rendered size before resizing
		// This prevents other columns from shifting when we resize
		const headerRow = th.parentElement;
		if (headerRow) {
			const allThs = headerRow.querySelectorAll('th');
			allThs.forEach((headerTh, idx) => {
				if (idx < cols.length) {
					const col = cols[idx];
					props.onColumnResize?.(col.key as string, `${headerTh.offsetWidth}px`);
				}
			});
		}

		resizeData = {
			leftColumn: leftCol.key as string,
			rightColumn: rightCol.key as string,
			startX: e.clientX,
			leftStartWidth: th.offsetWidth,
			rightStartWidth: nextTh.offsetWidth,
			minWidth,
		};

		setResizingColumn(leftCol.key as string);

		document.addEventListener("mousemove", handleResizeMove);
		document.addEventListener("mouseup", handleResizeEnd);
	};

	onCleanup(() => {
		document.removeEventListener("mousemove", handleResizeMove);
		document.removeEventListener("mouseup", handleResizeEnd);
	});

	// Check if resizer should show between this column and the next
	const canShowResizer = (colIndex: number): boolean => {
		if (props.allowResize === false) return false;
		const cols = visibleColumns();
		const leftCol = cols[colIndex];
		const rightCol = cols[colIndex + 1];
		if (!rightCol) return false; // No resizer on the last column
		return leftCol.resizable !== false && rightCol.resizable !== false;
	};

	return (
		<div class={styles["table-container"]}>
			<table class={styles["data-table"]}>
				<thead>
					<tr>
						<For each={visibleColumns()}>
							{(col, colIndex) => (
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
									<Show when={canShowResizer(colIndex())}>
										<div
											class={styles["resizer"]}
											onMouseDown={(e) => handleResizeStart(colIndex(), e)}
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

