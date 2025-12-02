# UnrealEmo Solid Component

A collection of elegant, reusable SolidJS components.

> Looking for React/Next.js? Check out [unrealemo-react-component](https://github.com/unrealemotion/unrealemo-react-component)

## Installation

```bash
npm install unrealemo-solid-component
# or
bun add unrealemo-solid-component
# or
pnpm add unrealemo-solid-component
```

## Components

### FilterableTable

A powerful data table with advanced filtering, sorting, column resizing, and CSV export.

```tsx
import { FilterableTable, ColumnDefinition } from "unrealemo-solid-component";
import "unrealemo-solid-component/styles";

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
}

const columns: ColumnDefinition<User>[] = [
  { key: "id", label: "ID", width: "80px", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "email", label: "Email", sortable: true },
  {
    key: "status",
    label: "Status",
    render: (value) => <span class={`badge-${value}`}>{value}</span>,
  },
];

function App() {
  const [data] = createSignal<User[]>([...]);

  return (
    <FilterableTable
      data={data()}
      columns={columns}
      defaultSort={{ column: "name", direction: "asc" }}
      exportFileName="users"
    />
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | required | Array of data to display |
| `columns` | `ColumnDefinition<T>[]` | required | Column definitions |
| `loading` | `boolean` | `false` | Show loading state |
| `defaultSort` | `{ column: string; direction: 'asc' \| 'desc' }` | - | Default sort configuration |
| `defaultVisibleColumns` | `string[]` | all columns | Columns to show by default |
| `rowClass` | `(row: T) => string` | - | Function to determine row CSS class |
| `showExport` | `boolean` | `true` | Show export button |
| `showColumnSelector` | `boolean` | `true` | Show column visibility selector |
| `allowResize` | `boolean` | `true` | Allow column resizing |
| `exportFileName` | `string` | `"export"` | Base name for exported file |
| `onFilteredDataChange` | `(data: T[]) => void` | - | Callback when filtered data changes |

### Button

A customizable button component.

```tsx
import { Button } from "unrealemo-solid-component";

<Button color="primary" variant="solid" size="md">
  Click me
</Button>

<Button color="danger" variant="outline" size="sm">
  Delete
</Button>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info'` | `'primary'` | Button color |
| `variant` | `'solid' \| 'outline' \| 'ghost'` | `'solid'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disable the button |
| `startIcon` | `JSXElement` | - | Icon before text |
| `endIcon` | `JSXElement` | - | Icon after text |

### Card

A simple card container component.

```tsx
import { Card } from "unrealemo-solid-component";

<Card class="my-card">
  Content goes here
</Card>
```

## Features

- 🔍 **Advanced Filtering** - AND/OR logic, regex support, case-sensitive toggle
- 📊 **Sortable Columns** - Click headers to sort ascending/descending
- 📏 **Resizable Columns** - Drag column borders to adjust width
- 👁️ **Column Visibility** - Show/hide columns dynamically
- 📥 **CSV Export** - Export visible or all data with timestamps
- 🎨 **Customizable** - Custom renderers, row classes, and styling

## License

MIT

