# Erdplus ERD to Relational Schema Converter

This is a TypeScript project that automatically converts Entity-Relationship Diagrams (ERDs) created in [Erdplus](https://erdplus.com/) into corresponding logical Relational Schemas.

It reads a `.erdplus` file (which is a JSON export) containing an ER diagram, applies standard database theory mapping rules to 3rd normal form, and outputs a new `.erdplus` file. This new file contains the equivalent Relational Schema, which can then be re-imported directly into Erdplus for visualization.

> [!NOTE]
> The primary goal of this tool is to automate the logical database design phase, allowing you to visualize the resulting relational schema directly within the same application you used for conceptual modeling.

## Features

The parser successfully maps the following ER diagram constructs to a relational model:

  * **Entities and Attributes**: Basic entities are mapped to tables and attributes to columns.
  * **Relationships (1:1, 1:N, M:N)**:
      * **1:1**: Mapped by propagating the primary key as a foreign key to the "optional" side.
      * **1:N**: Mapped by propagating the "1" side's primary key as a foreign key to the "N" side.
      * **M:N**: Mapped to a new associative table containing foreign keys from both participating entities.
  * **Composite Attributes**: "Cascading" attributes are flattened into multiple columns (e.g., `address_street`, `address_city`).
  * **Multivalued Attributes**: Mapped to a new table containing a foreign key for the parent entity and a column for the attribute's value.
  * **Weak Entities**: Correctly mapped, with the identifying relationship(s) creating a composite primary key. This includes handling cascades and multivalued attributes on weak entities.
  * **Supertypes and Inheritance**: Handles specialization hierarchies (subtypes) by propagating the supertype's primary key to all subtypes.
  * **Recursive Relationships**: Supported for all cardinalities (1:1, 1:N, M:N).
  * **Relationship Attributes**: Attributes on relationships are correctly assigned:
      * For M:N relationships, attributes are added to the associative table.
      * For 1:N or 1:1 relationships, attributes are added to the table that receives the foreign key.
> [!NOTE]
> **N-ary Relationships**: Per the modern Erdplus format, true n-ary relationships are modeled using an associative entity. The parser correctly supports this standard associative entity pattern.

## How to Use

The project is set up to batch-process files from the input directory.

1.  Place all your `.erdplus` diagram files into the `input/` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the main script:
    ```bash
    npm start
    ```
4.  Find your converted files in the `output/` directory. Each will be named `{original_name}-relational.erdplus`.

> [!WARNING]
> This tool **does not work** with old `.erdplus` file formats (any file created before November 1st, 2025). It is designed exclusively for the modern JSON structure.

## Project Structure

```
.
├── data/
│   ├── tests/              # Test input .erdplus ER diagrams
│   │   └── results/        # Test output .erdplus Relational schemas
├── input/                  # Input .erdplus ER diagrams
├── output/                 # Output .erdplus Relational schemas
└── src/
    ├── interfaces.ts       # TypeScript types for the Erdplus diagram structure
    ├── parser.ts           # Core ERD-to-Relational conversion logic
    ├── readErdplusFile.ts  # Utility to read and parse the .erdplus JSON file
    ├── saveErdplusFile.ts  # Utility to write the new diagram to a .erdplus file
    ├── index.ts            # Entry point for batch processing all files in /input
    └── test.ts             # Entry point for batch processing all test files in /data/tests
```

## Current Tests

1.  **[Passed]** Entity-Attribute
2.  **[Passed]** Entity-Relationship
3.  **[Passed]** Attribute cascade
4.  **[Passed]** Recursive relationship
5.  **[Skipped]** N-ary relationship
6.  **[Passed]** Weak entities + (identifying relationships + cascade)
7.  **[Passed]** Relationship attributes
8.  **[Passed]** Supertypes and multi-level inheritance
9.  **[Passed]** Supertype Relationship
10. **[Passed]** Multivalued Weak Entity Attribute

> [!NOTE]
> As noted in Features, the new Erdplus format no longer uses true n-ary relationships, so a specific test for this legacy construct is not required. The parser handles the modern associative entity equivalent.

## Future Work (TODO)

  * [ ] Refactor the code in `parser.ts` for better readability and maintenance, especially the attribute handling.
  * [ ] Implement proper automated unit tests (e.g., using Jest) to validate the output schema structure, rather than relying on manual file comparison.
  * [ ] Implement **Zod** for robust schema validation on the input `.erdplus` files.
  * [ ] Investigate the feasibility of adding support for legacy `.erdplus` file versions.

> [!IMPORTANT]
> As noted in `readErdplusFile.ts`, validating the input JSON with Zod is a high priority. It will make the parser much more resilient to unexpected file structures or future changes in the Erdplus format.