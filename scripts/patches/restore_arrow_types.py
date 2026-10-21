with open(r'C:\20.HDev\imgman\src\utils\shapeGenerators.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the missing arrow line types before 'line-arrow'
# The 6 variants from the checkpoint: line-arrow-both, start, open, dot, diamond
# Currently we have: arrow-right, arrow-bidirectional, line-arrow

# Insert new arrow types after 'arrow-bidirectional' and before 'speech-bubble'

new_arrow_types = '''    case 'line-arrow-both': {
      // Line with arrowheads at both ends
      const headW = w * 0.25;
      const shaftH = h * 0.4;
      const topY = (h - shaftH) / 2;
      const botY = topY + shaftH;
      return \`
        M 0 ${topY}
        H ${w - headW}
        V 0
        L ${w} ${h / 2}
        L ${w - headW} ${h}
        V ${botY}
        H ${w - headW}
        V ${h}
        Z
        M ${headW} 0
        L 0 ${h / 2}
        L ${headW} ${h}
        Z
        M 0 ${botY}
        L ${headW} ${h}
        L 0 ${h}
        Z
      \`.replace(/\s+/g, ' ').trim();
    }

    case 'line-arrow-start': {
      // Line with arrowhead at start only
      const headW = w * 0.3;
      const shaftH = h * 0.4;
      const topY = (h - shaftH) / 2;
      const botY = topY + shaftH;
      return \`
        M 0 ${topY}
        H ${w - headW}
        V 0
        L ${w} ${h / 2}
        L ${w - headW} ${h}
        V ${botY}
        H ${w - headW}
        V ${h}
        Z
        M ${headW} 0
        L 0 ${h / 2}
        L ${headW} ${h}
        Z
      \`.replace(/\s+/g, ' ').trim();
    }

    case 'line-arrow-open': {
      // Line with open arrowhead (no fill)
      const headW = w * 0.3;
      const headH = h * 0.4;
      return \`
        M 0 ${h / 2}
        L ${w - headW} ${h / 2}
        L ${w} ${h / 2 - headH}
        L ${w} ${h / 2}
        L ${w - headW} ${h / 2}
      \`.replace(/\s+/g, ' ').trim();
    }

    case 'line-arrow-dot': {
      // Line with dot at end instead of arrowhead
      const dotR = Math.min(w, h) * 0.2;
      return \`
        M 0 ${h / 2}
        L ${w} ${h / 2}
        M ${w} ${h / 2}
        C ${w} ${h / 2 - dotR} ${w + dotR} ${h / 2 - dotR} ${w + dotR} ${h / 2 + dotR}
        C ${w} ${h / 2 + dotR} ${w} ${h / 2 - dotR}
      \`.replace(/\s+/g, ' ').trim();
    }

    case 'diamond':'''

# Insert after 'arrow-bidirectional' case
insert_after = "    case 'arrow-bidirectional':"
if insert_after in content:
    content = content.replace(insert_after, new_arrow_types + "\n\n    " + insert_after)
    print("Added 5 arrow line types to shapeGenerators.ts")
else:
    print("Insert pattern not found")

with open(r'C:\20.HDev\imgman\src\utils\shapeGenerators.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("shapeGenerators.ts updated")