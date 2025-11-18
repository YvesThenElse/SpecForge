# Instructions d'adaptation finale - Browse

## Fichiers restants à adapter

### 1. TokenUsageTab.tsx

**Changements à faire:**

#### Imports (lignes 17-23):
```typescript
// AVANT:
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003';

interface TokenUsageTabProps {
  projectId: string;
}

// APRÈS:
import ApiService from '../services/api';

interface TokenUsageTabProps {
  projectPath: string;
}
```

#### TokenUsageEntry interface (ligne 28):
```typescript
// AVANT:
  projectId: string;
  type: 'analysis' | 'c4-generation' | 'summary' | 'wireframe' | 'veille-techno' | 'other';

// APRÈS:
  projectPath: string;
  type: 'analysis' | 'summary' | 'other';
```

#### Component signature (ligne 58):
```typescript
// AVANT:
const TokenUsageTab: React.FC<TokenUsageTabProps> = ({ projectId }) => {

// APRÈS:
const TokenUsageTab: React.FC<TokenUsageTabProps> = ({ projectPath }) => {
```

#### useEffect (ligne 68-73):
```typescript
// AVANT:
  useEffect(() => {
    if (projectId) {
      loadUsageData();
      loadStats();
    }
  }, [projectId, paginationModel.page, paginationModel.pageSize]);

// APRÈS:
  useEffect(() => {
    if (projectPath) {
      loadUsageData();
      loadStats();
    }
  }, [projectPath]);
```

#### Remove totalCount state (ligne 66):
```typescript
// SUPPRIMER cette ligne:
  const [totalCount, setTotalCount] = useState(0);
```

#### loadUsageData function (lignes 75-98):
```typescript
// AVANT:
  const loadUsageData = async () => {
    setLoading(true);
    try {
      const offset = paginationModel.page * paginationModel.pageSize;
      const response = await axios.get(
        `${API_URL}/api/projects/${projectId}/token-usage`,
        {
          params: {
            limit: paginationModel.pageSize,
            offset
          }
        }
      );

      setUsageData(response.data.entries);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Error loading token usage data:', error);
      setUsageData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

// APRÈS:
  const loadUsageData = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getTokenUsage(projectPath);
      setUsageData(data.entries || data || []);
    } catch (error) {
      console.error('Error loading token usage data:', error);
      setUsageData([]);
    } finally {
      setLoading(false);
    }
  };
```

#### loadStats function (lignes 100-110):
```typescript
// AVANT:
  const loadStats = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/projects/${projectId}/token-usage/stats`
      );
      setStats(response.data);
    } catch (error) {
      console.error('Error loading token usage stats:', error);
      setStats(null);
    }
  };

// APRÈS:
  const loadStats = async () => {
    try {
      const data = await ApiService.getTokenUsageStats(projectPath);
      setStats(data);
    } catch (error) {
      console.error('Error loading token usage stats:', error);
      setStats(null);
    }
  };
```

#### getTypeColor function (lignes 117-132):
```typescript
// AVANT:
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'analysis':
        return 'primary';
      case 'c4-generation':
        return 'secondary';
      case 'summary':
        return 'info';
      case 'wireframe':
        return 'warning';
      case 'veille-techno':
        return 'success';
      default:
        return 'default';
    }
  };

// APRÈS:
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'analysis':
        return 'primary';
      case 'summary':
        return 'info';
      default:
        return 'default';
    }
  };
```

#### getTypeLabel function (lignes 134-149):
```typescript
// AVANT:
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'analysis':
        return 'Requirements Analysis';
      case 'c4-generation':
        return 'C4 Diagram Generation';
      case 'summary':
        return 'Summary Generation';
      case 'wireframe':
        return 'Wireframe Generation';
      case 'veille-techno':
        return 'Tech Watch';
      default:
        return type;
    }
  };

// APRÈS:
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'analysis':
        return 'Specification Analysis';
      case 'summary':
        return 'Summary Generation';
      default:
        return type;
    }
  };
```

#### DataGrid component (ligne 329-355):
```typescript
// AVANT:
        {totalCount === 0 && !loading ? (
          <Alert severity="info" sx={{ m: 2 }}>
            No token usage data available yet. Usage will be tracked automatically when you use LLM features.
          </Alert>
        ) : (
          <DataGrid
            rows={usageData}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            rowCount={totalCount}
            paginationMode="server"
            loading={loading}

// APRÈS:
        {usageData.length === 0 && !loading ? (
          <Alert severity="info" sx={{ m: 2 }}>
            No token usage data available yet. Usage will be tracked automatically when you use LLM features.
          </Alert>
        ) : (
          <DataGrid
            rows={usageData}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            loading={loading}
```

### 2. ExportTab.tsx

**Fichier complet à remplacer** - Ce fichier nécessite une réécriture complète. Voir le fichier ExportTab_NEW.tsx.example pour la version adaptée.

## Comment appliquer les changements

1. Arrêtez `npm start` dans Browse (Ctrl+C dans la fenêtre Browse)
2. Ouvrez TokenUsageTab.tsx dans votre éditeur
3. Appliquez les changements listés ci-dessus
4. Sauvegardez le fichier
5. Relancez `npm start`
6. Vérifiez qu'il n'y a plus d'erreurs de compilation

## Vérification

Une fois les changements appliqués, vous ne devriez plus avoir d'erreurs TypeScript pour:
- TokenUsageTab acceptant projectPath
- Les types liés à 'analysis', 'c4-generation', etc.
