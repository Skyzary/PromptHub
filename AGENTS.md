# AI Agent Guidelines

## ⚠️ CRITICAL INSTRUCTION: Codebase Reading via repomix.xml

Instead of reading source files individually across the repository using directory traversal or multiple file-reading tools:
1. **Always read `repomix.xml` (or `repomix-output.xml`) first**:
   - The entire codebase is bundled and packed into `repomix.xml` in the project root.
   - Use `repomix.xml` as the primary source of truth for analyzing, searching, inspecting, and understanding existing code, architecture, functions, styles, and configurations.
2. **File Modifications**:
   - `repomix.xml` is for reading/context.
   - When making code changes or applying fixes, modify the actual source files directly in the repository (e.g. `src/...`).
