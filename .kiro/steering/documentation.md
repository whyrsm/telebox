# Documentation File Organization

## Rule
All documentation and specification files must be organized in a `docs` directory with date-prefixed naming.

## File Naming Convention
All `.md` files for documentation or specifications should follow this format:
```
docs/{YYYYMMDD}_{FILE_NAME}.md
```

### Examples
- `docs/20251228_api_specification.md`
- `docs/20251228_architecture_overview.md`
- `docs/20251228_deployment_guide.md`
- `docs/20251228_feature_requirements.md`

## Directory Structure
```
project-root/
├── docs/
│   ├── 20251228_project_overview.md
│   ├── 20251228_api_docs.md
│   └── 20251228_setup_guide.md
├── README.md (root-level readme is exception)
└── ...
```

## When to Use
- Technical specifications
- Feature documentation
- Architecture decisions
- API documentation
- Setup and deployment guides
- Design documents
- Requirements documents

## Exceptions
- Root-level `README.md` files
- Package-specific `README.md` files (e.g., `frontend/README.md`)
- Auto-generated documentation
- Changelog files

## Benefits
- Chronological organization
- Easy to track when documentation was created
- Prevents naming conflicts
- Clear separation of documentation from code

## Tips
- Use the current date when creating new documentation
- Use descriptive, lowercase file names with underscores
- Keep documentation up-to-date — update the file rather than creating duplicates
- Reference other docs using relative paths
