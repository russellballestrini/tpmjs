# Domain Reference

## Entities

Reusable output types defined in blocks.yml. Reference these in your tool's output `type` field.

| Entity | Fields |
|--------|--------|
| url | href, domain, protocol, path, query, fragment |
| webpage | url, title, html, text, metadata |
| text_content | raw, sentences, paragraphs, wordCount |
| claim | statement, confidence, needsCitation, category |
| timeline | events, dateRange, gaps, eventCount |
| evidence | source, type, strength, relevance |
| summary | text, keyPoints, length, compressionRatio |
| sentiment | score, label, confidence, aspects |
| entity | name, type, mentions, context |
| relationship | source, target, type, strength |
| pattern | name, frequency, examples, significance |
| anomaly | description, severity, context, recommendation |
| metric | name, value, unit, trend |
| comparison | items, criteria, rankings, analysis |
| recommendation | action, priority, rationale, impact |
| risk | description, likelihood, impact, mitigation |
| code_snippet | language, code, explanation, complexity |
| api_endpoint | method, path, parameters, response |
| data_schema | fields, types, constraints, relationships |
| workflow_step | action, input, output, conditions |

## Quality Measures

Reference these in your output's `measures` array.

| Measure | Severity | What it checks |
|---------|----------|---------------|
| working_implementation | error | No TODOs, stubs, or placeholders. Returns actual computed values. |
| valid_output_structure | error | Returns object matching declared interface. All required fields present. Arrays never undefined. |
| proper_error_handling | error | Throws descriptive Error with context. Validates inputs. Catches external API errors. |
| ai_sdk_compliance | error | Uses `tool()` + `jsonSchema()` from 'ai'. Clear description. Every property has description. |
| npm_publishable | error | Valid package.json with tpmjs field. Named + default exports. Proper types. Semver version. |
| readme_documentation | error | README exists. Describes tool. Usage example. Documents inputs/outputs. |
| deterministic_output | warning | Same input produces same output (where applicable). |
| minimal_dependencies | warning | Uses stable, well-maintained packages. Avoids unnecessary deps. |

## Domain Rules

Common domain rule categories for the `domain_rules` field in blocks.yml:

- **Core implementation**: working code, proper types, error handling
- **Web & fetch**: URL validation, content extraction, timeout handling
- **Document generation**: format compliance, template rendering
- **Data transformation**: schema validation, type coercion, encoding
- **Engineering/code analysis**: AST parsing, complexity metrics
- **Security & compliance**: input sanitization, safe execution
- **Statistical rigor**: numerical accuracy, proper rounding
- **Workflow/recipe**: step sequencing, state management

Define custom rules specific to your tool's requirements. Each rule needs an `id` and `description`.
