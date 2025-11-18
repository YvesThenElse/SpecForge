# Prompts Management System

This directory contains all the prompts used by the LLM services in the SSoT backend.

## Structure

```
prompts/
├── metadata.json           # Metadata about all prompts and categories
├── analysis/               # Prompts for analyzing requirements
│   ├── user-story.txt
│   └── technical-points.txt
├── generation/             # Prompts for generating artifacts (future)
├── validation/             # Prompts for validation (future)
└── history/                # Version history (auto-generated)
```

## Metadata Format

The `metadata.json` file contains:

```json
{
  "prompts": [
    {
      "id": "analysis-user-story",
      "name": "User Story Analysis",
      "description": "Analyze user stories...",
      "category": "Analysis",
      "file": "analysis/user-story.txt",
      "version": 1,
      "createdAt": "2025-01-04T00:00:00Z",
      "updatedAt": "2025-01-04T00:00:00Z"
    }
  ],
  "categories": [
    {
      "id": "analysis",
      "name": "Analysis",
      "description": "Prompts for analyzing input",
      "order": 1
    }
  ]
}
```

## Prompt Templates

Prompts can use placeholders:
- `{{TEXT}}` - The input text to analyze/process

Example:
```
You are an expert...

Analyze the following text:
"""
{{TEXT}}
"""

Return your analysis...
```

## Versioning

Every time a prompt is modified through the API:
1. The current version is saved to `history/`
2. The version number is incremented
3. The new content is written to the prompt file
4. The `updatedAt` timestamp is updated in metadata

Version files are named: `{promptId}_v{version}_{timestamp}.txt`

## API Endpoints

### Get Categories
```
GET /api/prompts/categories
```

### Get All Prompts
```
GET /api/prompts
GET /api/prompts?category=analysis
```

### Get Specific Prompt
```
GET /api/prompts/{promptId}
```

### Update Prompt
```
PUT /api/prompts/{promptId}
Body: { "content": "...", "author": "..." }
```

### Rollback to Version
```
POST /api/prompts/{promptId}/rollback
Body: { "version": 1, "author": "..." }
```

### Get Version History
```
GET /api/prompts/{promptId}/versions
```

## Usage in Code

```typescript
// In LLMService or other services
const promptService = new PromptService();

// Get prompt content
const promptContent = promptService.getPromptContent('analysis-user-story');

// Replace placeholders
const finalPrompt = promptContent.replace(/\{\{TEXT\}\}/g, userInput);
```

## Adding New Prompts

1. Create the prompt file in the appropriate category folder
2. Add metadata entry in `metadata.json`
3. Restart the backend server

Or use the API:
```
POST /api/prompts
Body: {
  "id": "new-prompt",
  "name": "New Prompt",
  "description": "...",
  "category": "Analysis",
  "content": "..."
}
```

## Managing Prompts via UI

Open Browse application and go to the **📝 Prompts** tab to:
- View all prompts organized by category
- Edit prompts with live preview
- View version history
- Rollback to previous versions
- Create new prompts

All changes are automatically versioned and can be rolled back!
