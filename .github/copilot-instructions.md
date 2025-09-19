# Copilot Instructions for lfsoares-front

## Architecture Overview

This is a React/TypeScript SPA for generating training documents (certificates, presence lists, identifiers) built with modern React patterns and Vite.

**Core Architecture:**

- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: React Router v6 with nested routes and protected routes
- **State Management**: React Context API (AuthContext) + localStorage persistence
- **HTTP Client**: Axios with request/response interceptors for JWT authentication
- **UI Framework**: Radix UI primitives + Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation schemas
- **Document Generation**: Docxtemplater + PizZip for Word/PPTX docs

**Key Components:**

- **Identificadores.tsx**: Complex form with instructor assignments, period management, and participant selection
- **Pessoas.tsx**: CRUD interface with modal forms and table filtering
- **CustomTable**: Reusable table component with sorting, pagination, and actions
- **ParticipantesTable**: Specialized table for multi-select with filters and inline modal

## Key Patterns & Conventions

### Data Flow & State Management

```typescript
// Authentication pattern - Context + localStorage
const AuthContext = createContext<AuthContextType>();
const [user, setUser] = useState<User | null>(() => {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
});

// API calls with error handling
try {
  const response = await api.get("endpoint");
  // handle success
} catch (error) {
  toast.error("Erro na operação");
}
```

### HTTP & API Integration

```typescript
// Axios interceptor pattern for JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // handle unauthorized
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);
```

### Form Validation & Submission

```typescript
// React Hook Form + Zod pattern
const schema = z.object({
  participantes: z.array(z.string()).min(1, "Selecione participantes"),
  evento: z.string().min(1, "Selecione um evento"),
});

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(schema),
});

// Form submission with loading states
const onSubmit = async (data: FormData) => {
  try {
    setLoading(true);
    await api.post("endpoint", data);
    toast.success("Operação realizada!");
  } catch (error) {
    toast.error("Erro na operação");
  } finally {
    setLoading(false);
  }
};
```

### Multi-Select Table Pattern

```tsx
// Custom table with row-click selection and filters
const ParticipantesTable = ({ participantes, selectedIds, onSelectionChange }) => {
  const [filters, setFilters] = useState({
    name: "", cpf: "", matricula: "", empresa: ""
  });

  const filteredData = participantes.filter(pessoa => {
    // Filter logic for each field
    return pessoa.name.toLowerCase().includes(filters.name.toLowerCase()) &&
           pessoa.cpf.includes(filters.cpf) &&
           pessoa.matricula.includes(filters.matricula) &&
           pessoa.empresa?.name.includes(filters.empresa);
  });

  return (
    <div className="border rounded max-h-96 overflow-y-auto">
      {/* Filter inputs */}
      <div className="grid grid-cols-4 gap-4 p-4">
        <Input placeholder="Nome" value={filters.name} onChange={...} />
        {/* Other filter inputs */}
      </div>

      {/* Table with row click selection */}
      <Table>
        <TableBody>
          {filteredData.map((pessoa) => (
            <TableRow
              key={pessoa.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onSelectionChange(!selectedIds.includes(pessoa.id))}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={selectedIds.includes(pessoa.id)} />
              </TableCell>
              {/* Other cells */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
```

### Period Calculation Logic

```typescript
// Business logic for time period determination
export function calcularPeriodoDia(start: string, end: string): Period {
  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours + minutes / 60.0;
  };

  const startTime = parseTime(start);
  const endTime = parseTime(end);

  // Complex logic for morning/afternoon/night combinations
  if (startsBeforeMidday && endsAfterEvening) return "manhaNoite";
  if (startsBeforeMidday && endsBeforeEvening) return "manha";
  // ... more combinations
}
```

## Critical Developer Workflows

### Environment Setup

```bash
# Required environment variables in .env
VITE_BACKEND_DOMAIN=https://api.example.com

# Development setup
npm install
npm run dev
```

### Development Commands

```bash
npm run dev          # Vite dev server with HMR
npm run build        # TypeScript compilation + Vite build (tsc -b)
npm run lint         # ESLint with React rules
npm run preview      # Preview production build
```

### Build Process

- **Type Checking**: `tsc -b` runs before Vite build
- **Bundle Analysis**: Large chunks (>500KB) trigger warnings
- **Asset Optimization**: SVG, fonts, and templates in `/public/`
- **Path Aliases**: `@/` resolves to `./src/`

## Project-Specific Conventions

### Naming & Language

- **UI Labels**: Portuguese ("Manhã", "Tarde", "Noite", "Adicionar Participante")
- **File Names**: Portuguese for business components (`Pessoas.tsx`, `Identificadores.tsx`)
- **Type Names**: Portuguese for domain models (`Pessoa`, `Evento`, `Treinamento`)
- **API Endpoints**: Portuguese (`/pessoas`, `/eventos`, `/treinamentos`)

### Component Structure

```typescript
// Consistent component pattern
interface ComponentProps {
  // Props with clear typing
  data?: SomeType[];
  onAction?: (id: string) => void;
}

const ComponentName: React.FC<ComponentProps> = ({ data = [], onAction }) => {
  const [state, setState] = useState<InitialState>();
  const [loading, setLoading] = useState(false);

  // Business logic
  const handleAction = async () => {
    try {
      setLoading(true);
      await api.post("endpoint", data);
      toast.success("Sucesso!");
    } catch (error) {
      toast.error("Erro");
    } finally {
      setLoading(false);
    }
  };

  return <JSX />;
};
```

### Error Handling & Notifications

```typescript
// Consistent error handling pattern
try {
  const response = await api.post("endpoint", data);
  toast.success("Operação realizada com sucesso!");
} catch (error) {
  console.error("API Error:", error);
  toast.error("Erro ao realizar operação");
}

// Authentication error handling
if (error.response?.status === 401) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
}
```

### Document Generation

```typescript
// Docxtemplater pattern with template replacement
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

const generateDocument = async (templatePath: string, data: any) => {
  const zip = new PizZip(await loadFile(templatePath));
  const doc = new Docxtemplater();

  doc.loadZip(zip);
  doc.setData({
    nome_instrutor: data.instructor.name,
    endereco: data.address.morning,
    datas: formatarDatas(data.dates),
    participantes: data.participants,
  });

  doc.render();
  const output = doc.getZip().generate({ type: "blob" });

  saveAs(output, `documento_${new Date().toISOString().split("T")[0]}.docx`);
};
```

## Integration Points

### External Dependencies

- **Document Templates**: `/public/templates/` (Word/PPTX files)
- **Backend API**: RESTful API with JWT authentication
- **File Generation**: Client-side document creation with download
- **Date Handling**: `date-fns` for date formatting and manipulation

### Cross-Component Communication

- **Auth Context**: Global user state and authentication status
- **Toast Notifications**: `react-hot-toast` for consistent user feedback
- **Modal Management**: Centralized modal state in parent components
- **Table Components**: Reusable `CustomTable` and `ParticipantesTable`

## File Structure Highlights

```
src/
├── @types/           # TypeScript definitions (Pessoa, Evento, etc.)
│   ├── Pessoa.ts     # Person interface with status, empresa, etc.
│   ├── Evento.ts     # Event interface with course dates/locations
│   └── ...
├── components/       # React components
│   ├── ui/          # shadcn/ui components (button, input, table, etc.)
│   ├── CustomTable.tsx    # Reusable table with actions
│   ├── ParticipantesTable.tsx # Multi-select table component
│   └── Identificadores.tsx # Complex form component
├── context/         # React Context providers
│   └── AuthContextProvider.tsx
├── lib/            # Utilities (axios config)
├── pages/          # Route components (Login, Home)
├── utils/          # Business logic utilities
│   ├── calcular-periodo-dia.ts # Time period calculations
│   ├── gerar-certificado.ts    # Certificate generation
│   └── identificador.ts        # Document generation logic
└── hooks/          # Custom React hooks
```

## Common Patterns to Follow

1. **Always use TypeScript interfaces** for component props and API responses
2. **Wrap API calls in try/catch** with toast notifications for user feedback
3. **Use React Hook Form + Zod** for complex form validation
4. **Follow Portuguese naming** for UI labels and business domain terms
5. **Implement row-click selection** for table interactions (not just checkboxes)
6. **Use the established modal pattern** for create/edit operations
7. **Leverage CustomTable/ParticipantesTable** for consistent table interfaces
8. **Handle authentication errors** by clearing localStorage and redirecting to login
9. **Use consistent loading states** with `setLoading(true/false)` pattern
10. **Format dates consistently** using `date-fns` and Portuguese locale

Reference: `src/@types/` for data models, `src/utils/` for business logic, `src/components/ui/` for design system components.
