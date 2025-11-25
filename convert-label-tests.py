#!/usr/bin/env python3
import re

# Read the file
with open('packages/ui/src/Label/Label.test.tsx', 'r') as f:
    content = f.read()

# Pattern 1: Simple createElement(Label, null, "text")
content = re.sub(
    r'createElement\(Label,\s*null,\s*"([^"]+)"\)',
    r'<Label>\1</Label>',
    content
)

# Pattern 2: createElement(Label, { props }, "text") - multi-line
# First collect all multi-line createElement calls
lines = content.split('\n')
result = []
i = 0

while i < len(lines):
    line = lines[i]

    # Check if this line starts a createElement(Label, ...
    if 'createElement(' in line and 'Label' in line and '{' in line:
        # Collect the full createElement call
        depth = 0
        start_line = i
        full_call = []

        for j in range(i, len(lines)):
            full_call.append(lines[j])
            depth += lines[j].count('(') - lines[j].count(')')
            if depth == 0:
                i = j
                break

        # Parse the collected createElement call
        call_text = '\n'.join(full_call)

        # Try to extract props and children
        match = re.search(r'createElement\(\s*Label,\s*\{([^}]+)\},\s*"([^"]+)"\s*\)', call_text, re.DOTALL)
        if match:
            props_text = match.group(1).strip()
            children_text = match.group(2)

            # Convert props to JSX format
            props_list = []
            for prop_line in props_text.split('\n'):
                prop_line = prop_line.strip().rstrip(',')
                if prop_line and ':' in prop_line:
                    # Handle different prop types
                    if '"data-testid":' in prop_line or "'data-testid':" in prop_line:
                        props_list.append('data-testid=' + prop_line.split(':')[1].strip())
                    elif 'required:' in prop_line:
                        val = prop_line.split(':')[1].strip()
                        if val == 'true':
                            props_list.append('required')
                        else:
                            props_list.append(f'required={{{val}}}')
                    elif 'disabled:' in prop_line:
                        val = prop_line.split(':')[1].strip()
                        if val == 'true':
                            props_list.append('disabled')
                        else:
                            props_list.append(f'disabled={{{val}}}')
                    elif 'size:' in prop_line:
                        val = prop_line.split(':')[1].strip()
                        props_list.append(f'size={val}')
                    elif 'className:' in prop_line:
                        val = prop_line.split(':')[1].strip()
                        props_list.append(f'className={val}')
                    elif 'htmlFor:' in prop_line:
                        val = prop_line.split(':')[1].strip()
                        props_list.append(f'htmlFor={val}')
                    elif 'id:' in prop_line:
                        val = prop_line.split(':')[1].strip()
                        props_list.append(f'id={val}')
                    elif '"aria-label":' in prop_line or "'aria-label':" in prop_line:
                        val = prop_line.split(':')[1].strip()
                        props_list.append(f'aria-label={val}')
                    elif '"aria-describedby":' in prop_line or "'aria-describedby':" in prop_line:
                        val = prop_line.split(':')[1].strip()
                        props_list.append(f'aria-describedby={val}')

            # Build JSX
            indent = '			'
            if len(props_list) <= 2:
                jsx = f'{indent}render(<Label {" ".join(props_list)}>{children_text}</Label>);'
            else:
                jsx = f'{indent}render(\n{indent}	<Label\n'
                for prop in props_list:
                    jsx += f'{indent}		{prop}\n'
                jsx += f'{indent}	>\n{indent}		{children_text}\n{indent}	</Label>,\n{indent});'

            result.append(jsx)
        else:
            # Couldn't parse, keep original
            result.extend(full_call)
    else:
        result.append(line)

    i += 1

# Write back
content = '\n'.join(result)
with open('packages/ui/src/Label/Label.test.tsx', 'w') as f:
    f.write(content)

print("Conversion complete!")
