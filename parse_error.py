import re

html = open("error500.html", "r", encoding="utf-8").read()

# Find Exception Type
type_match = re.search(r'<th>Exception Type:</th>\s*<td>(.*?)</td>', html)
if type_match:
    print(f"Exception Type: {type_match.group(1).strip()}")

# Find Exception Value
val_match = re.search(r'<th>Exception Value:</th>\s*<td><pre>(.*?)</pre>', html, re.DOTALL)
if val_match:
    print(f"Exception Value: {val_match.group(1).strip()}")

# Find Exception Location
loc_match = re.search(r'<th>Exception Location:</th>\s*<td>(.*?)</td>', html)
if loc_match:
    print(f"Exception Location: {loc_match.group(1).strip()}")

# Find latest traceback related to api_views
tb_match = re.search(r'api_views\.py.*?in (\w+).*?<ol .*?>(.*?)</ol>', html, re.DOTALL)
if tb_match:
    func_name = tb_match.group(1)
    code_lines = re.sub(r'<[^>]+>', '', tb_match.group(2))
    print(f"\nTraceback in {func_name}:")
    print(code_lines.strip())
