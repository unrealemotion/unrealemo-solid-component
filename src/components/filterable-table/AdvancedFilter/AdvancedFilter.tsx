import { Component, createSignal, For, Show, onCleanup } from "solid-js";
import { Button } from "../ui";
import PlusIcon from "~icons/mdi/plus";
import DeleteIcon from "~icons/mdi/delete";
import FolderPlusIcon from "~icons/mdi/folder-plus";
import RefreshIcon from "~icons/mdi/refresh";
import type {
	AdvancedFilterProps,
	FilterGroup,
	FilterCondition,
	FilterNode,
} from "../types";
import { generateId, createDefaultFilter, deepClone } from "../types";
import styles from "./AdvancedFilter.module.scss";

// Mutable filter values store (prevents re-renders on input)
const filterValuesStore: Map<
	string,
	{ column: string; regex: string; caseSensitive: boolean }
> = new Map();

const getFilterValue = (
	id: string,
	defaultColumn: string,
	defaultRegex: string,
	defaultCaseSensitive: boolean = false
) => {
	if (!filterValuesStore.has(id)) {
		filterValuesStore.set(id, {
			column: defaultColumn,
			regex: defaultRegex,
			caseSensitive: defaultCaseSensitive,
		});
	}
	return filterValuesStore.get(id)!;
};

const setFilterValue = (
	id: string,
	column: string,
	regex: string,
	caseSensitive: boolean
) => {
	filterValuesStore.set(id, { column, regex, caseSensitive });
};

// Build complete filter tree with current values from store
const buildFilterWithValues = (node: FilterNode): FilterNode => {
	if (node.type === "condition") {
		const values = getFilterValue(
			node.id,
			node.column,
			node.regex,
			node.caseSensitive ?? false
		);
		return {
			...node,
			column: values.column,
			regex: values.regex,
			caseSensitive: values.caseSensitive,
		};
	}
	return {
		...node,
		children: node.children.map(buildFilterWithValues),
	};
};

// --- Filter Condition Item ---
const FilterConditionItem: Component<{
	condition: FilterCondition;
	columns: { value: string; label: string }[];
	onRemove: () => void;
	onValueChange: () => void;
	onEnterKey: () => void;
}> = (props) => {
	const initialValues = getFilterValue(
		props.condition.id,
		props.condition.column || props.columns[0]?.value || "",
		props.condition.regex,
		props.condition.caseSensitive ?? false
	);
	const [localColumn, setLocalColumn] = createSignal(initialValues.column);
	const [localRegex, setLocalRegex] = createSignal(initialValues.regex);
	const [localCaseSensitive, setLocalCaseSensitive] = createSignal(
		initialValues.caseSensitive
	);

	const handleColumnChange = (value: string) => {
		setLocalColumn(value);
		setFilterValue(props.condition.id, value, localRegex(), localCaseSensitive());
		props.onValueChange();
	};

	const handleRegexInput = (value: string) => {
		setLocalRegex(value);
		setFilterValue(props.condition.id, localColumn(), value, localCaseSensitive());
		props.onValueChange();
	};

	const handleCaseSensitiveChange = (checked: boolean) => {
		setLocalCaseSensitive(checked);
		setFilterValue(props.condition.id, localColumn(), localRegex(), checked);
		props.onValueChange();
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			props.onEnterKey();
		}
	};

	return (
		<div class={styles["filter-item"]}>
			<select
				class={`form-select ${styles["column-select"]}`}
				value={localColumn()}
				onChange={(e) => handleColumnChange(e.currentTarget.value)}
			>
				<For each={props.columns}>
					{(opt) => <option value={opt.value}>{opt.label}</option>}
				</For>
			</select>
			<input
				type="text"
				class={`form-control ${styles["regex-input"]}`}
				placeholder="Regex..."
				value={localRegex()}
				onInput={(e) => handleRegexInput(e.currentTarget.value)}
				onKeyDown={handleKeyDown}
			/>
			<label class={styles["case-sensitive-label"]} title="Case sensitive">
				<input
					type="checkbox"
					checked={localCaseSensitive()}
					onChange={(e) => handleCaseSensitiveChange(e.currentTarget.checked)}
				/>
				<span>Aa</span>
			</label>
			<Button
				color="danger"
				variant="outline"
				size="sm"
				onClick={props.onRemove}
				class={styles["action-btn"]}
				title="Remove condition"
			>
				<DeleteIcon />
			</Button>
		</div>
	);
};

// --- Filter Group Builder ---
const FilterGroupBuilder: Component<{
	group: FilterGroup;
	columns: { value: string; label: string }[];
	onStructureChange: (updated: FilterGroup) => void;
	onValueChange: () => void;
	onEnterKey: () => void;
	onRemove: () => void;
	isRoot?: boolean;
}> = (props) => {
	const handleToggleOperator = () => {
		const updated = deepClone(props.group);
		updated.operator = updated.operator === "AND" ? "OR" : "AND";
		props.onStructureChange(updated);
	};

	const handleAddCondition = () => {
		const newId = generateId();
		const defaultColumn = props.columns[0]?.value || "";
		setFilterValue(newId, defaultColumn, "", false);
		const updated = deepClone(props.group);
		updated.children.push({
			id: newId,
			type: "condition",
			column: defaultColumn,
			regex: "",
			caseSensitive: false,
		});
		props.onStructureChange(updated);
	};

	const handleAddGroup = () => {
		const newConditionId = generateId();
		const defaultColumn = props.columns[0]?.value || "";
		setFilterValue(newConditionId, defaultColumn, "", false);
		const updated = deepClone(props.group);
		updated.children.push({
			id: generateId(),
			type: "group",
			operator: "AND",
			children: [
				{
					id: newConditionId,
					type: "condition",
					column: defaultColumn,
					regex: "",
					caseSensitive: false,
				},
			],
		});
		props.onStructureChange(updated);
	};

	const handleRemoveChild = (index: number) => {
		const child = props.group.children[index];
		const removeFromStore = (node: FilterNode) => {
			if (node.type === "condition") {
				filterValuesStore.delete(node.id);
			} else {
				node.children.forEach(removeFromStore);
			}
		};
		removeFromStore(child);

		const updated = deepClone(props.group);
		updated.children.splice(index, 1);
		props.onStructureChange(updated);
	};

	const handleChildStructureChange = (index: number, child: FilterNode) => {
		const updated = deepClone(props.group);
		updated.children[index] = child;
		props.onStructureChange(updated);
	};

	return (
		<div
			class={`${styles["filter-group"]} ${props.isRoot ? styles["root-group"] : ""}`}
		>
			<div class={styles["group-header"]}>
				<Button
					color={props.group.operator === "AND" ? "primary" : "warning"}
					size="sm"
					onClick={handleToggleOperator}
					class={styles["operator-toggle"]}
				>
					{props.group.operator}
				</Button>
				<Button
					color="secondary"
					variant="outline"
					size="sm"
					onClick={handleAddCondition}
					class={styles["action-btn"]}
					title="Add Condition"
				>
					<PlusIcon /> Condition
				</Button>
				<Button
					color="secondary"
					variant="outline"
					size="sm"
					onClick={handleAddGroup}
					class={styles["action-btn"]}
					title="Add Group"
				>
					<FolderPlusIcon /> Group
				</Button>
				<Show when={!props.isRoot}>
					<Button
						color="danger"
						variant="outline"
						size="sm"
						onClick={props.onRemove}
						class={styles["action-btn"]}
						title="Remove Group"
					>
						<DeleteIcon />
					</Button>
				</Show>
			</div>
			<For each={props.group.children}>
				{(child, index) => (
					<Show
						when={child.type === "group"}
						fallback={
							<FilterConditionItem
								condition={child as FilterCondition}
								columns={props.columns}
								onRemove={() => handleRemoveChild(index())}
								onValueChange={props.onValueChange}
								onEnterKey={props.onEnterKey}
							/>
						}
					>
						<FilterGroupBuilder
							group={child as FilterGroup}
							columns={props.columns}
							onStructureChange={(updated) =>
								handleChildStructureChange(index(), updated)
							}
							onValueChange={props.onValueChange}
							onEnterKey={props.onEnterKey}
							onRemove={() => handleRemoveChild(index())}
						/>
					</Show>
				)}
			</For>
		</div>
	);
};


// --- Main Advanced Filter Component ---
export const AdvancedFilter: Component<AdvancedFilterProps> = (props) => {
	const [filterRoot, setFilterRoot] = createSignal<FilterGroup>(
		createDefaultFilter()
	);
	const [isAutoApply, setIsAutoApply] = createSignal(
		props.defaultAutoApply ?? true
	);
	let debouncedTimerRef: ReturnType<typeof setTimeout> | null = null;

	// Evaluates a single row against the filter tree
	const createEvaluator = (root: FilterGroup) => {
		const evaluateNode = (
			node: FilterNode,
			row: Record<string, unknown>
		): boolean => {
			if (node.type === "condition") {
				if (!node.regex) return true;
				try {
					const flags = node.caseSensitive ? "" : "i";
					const regex = new RegExp(node.regex, flags);
					const value = row[node.column];
					const strValue =
						value === null || value === undefined ? "" : String(value);
					return regex.test(strValue);
				} catch {
					return false;
				}
			} else {
				if (node.children.length === 0) return true;
				if (node.operator === "AND") {
					return node.children.every((child) => evaluateNode(child, row));
				} else {
					return node.children.some((child) => evaluateNode(child, row));
				}
			}
		};

		return (row: Record<string, unknown>) => evaluateNode(root, row);
	};

	const applyFilter = () => {
		const completeFilter = buildFilterWithValues(filterRoot()) as FilterGroup;
		props.onFilterChange(createEvaluator(completeFilter));
	};

	const triggerDebouncedApply = () => {
		if (debouncedTimerRef) {
			clearTimeout(debouncedTimerRef);
			debouncedTimerRef = null;
		}

		if (isAutoApply()) {
			debouncedTimerRef = setTimeout(() => {
				applyFilter();
			}, 500);
		}
	};

	const handleStructureChange = (updated: FilterGroup) => {
		setFilterRoot(updated);
		triggerDebouncedApply();
	};

	const handleValueChange = () => {
		triggerDebouncedApply();
	};

	const handleEnterKey = () => {
		if (!isAutoApply()) {
			if (debouncedTimerRef) {
				clearTimeout(debouncedTimerRef);
				debouncedTimerRef = null;
			}
			applyFilter();
		}
	};

	const handleReset = () => {
		// Create evaluator that matches everything
		props.onFilterChange(() => true);
		props.onReset?.();
	};

	onCleanup(() => {
		if (debouncedTimerRef) {
			clearTimeout(debouncedTimerRef);
		}
	});

	return (
		<div class={styles["filter-card"]}>
			<div class={styles["filter-header"]}>
				<h6>Filter - Advanced</h6>
				<div class={styles["filter-controls"]}>
					<label class={styles["auto-apply-label"]}>
						<input
							type="checkbox"
							checked={isAutoApply()}
							onChange={(e) => setIsAutoApply(e.currentTarget.checked)}
						/>
						<span>Auto-apply (500ms)</span>
					</label>
					<Button
						color="secondary"
						variant="outline"
						size="sm"
						startIcon={<RefreshIcon />}
						onClick={handleReset}
					>
						Reset
					</Button>
				</div>
			</div>

			<div class={styles["filter-tree-container"]}>
				<FilterGroupBuilder
					group={filterRoot()}
					columns={props.columns}
					onStructureChange={handleStructureChange}
					onValueChange={handleValueChange}
					onEnterKey={handleEnterKey}
					onRemove={() => {}}
					isRoot
				/>
			</div>
		</div>
	);
};

export default AdvancedFilter;

