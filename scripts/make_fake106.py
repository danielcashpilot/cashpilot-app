# Builds the fake 106 forms in test-docs (HTML). Then print them to PDF/PNG with
# Edge headless (see the note at the bottom). Answers: test-docs/answers106.json.
# Run: python scripts/make_fake106.py
import io, os

CSS = """body{font-family:Arial;direction:rtl;margin:28px;font-size:13px;color:#111}
h1{font-size:18px;text-align:center;margin:0 0 4px} h2{font-size:14px;margin:14px 0 4px}
table{width:100%;border-collapse:collapse} td,th{border:1px solid #888;padding:3px 6px;text-align:right}
th{background:#eee} .n{text-align:left;font-family:Courier New} .box{border:1px solid #888;padding:6px;margin:6px 0;border-radius:6px}
.top{display:flex;justify-content:space-between}"""

def tbl(rows):
    return "".join(f"<tr><td>{c}</td><td>{d}</td><td class=n>{a}</td></tr>" for c, d, a in rows)

def form(year, emp, worker, months_mask, pay, ded, points, pts_value, classes, funds, employer_tot, insured):
    h = "".join(f"<th>{i}</th>" for i in range(1, 13))
    m = "".join(f"<td>{'כן' if x else 'לא'}</td>" for x in months_mask)
    fr = "".join(f"<tr><td>{c}</td><td>{n}</td><td>{t}</td><td class=n>{b}</td><td>{p}</td><td class=n>{e}</td></tr>" for c, n, t, b, p, e in funds)
    head = "<tr><th>שדה/סעיף</th><th>תיאור</th><th>סכום</th></tr>"
    return f"""<!doctype html><meta charset=utf-8><style>{CSS}</style>
<h1>טופס 106 לשנת המס {year}</h1><div style="text-align:center">אישור עפ"י תקנות מס הכנסה - ניכוי ממשכורת</div>
<div class=top><div><b>{emp}</b><br>תיק ניכויים: 9{year}1234</div>
<div><b>פירוט חודשי העבודה בשנת המס</b><table><tr>{h}</tr><tr>{m}</tr></table>
<div class=box>סה"כ חודשי עבודה בשנת המס {sum(months_mask)}</div></div></div>
<div class=box>העובד/ת: <b>{worker}</b><br>הועסק/ה במשרה יחידה</div>
<h2>תשלומים</h2><table>{head}{tbl(pay)}</table>
<h2>הפרשות מעסיק</h2><table>{head}{tbl([("244/245", "הכנסה מבוטחת", f"{insured:,}"), ("248/249", 'סה"כ הפרשות המעסיק לקופ"ג לרבות מרכיב פיצויים', f"{employer_tot:,}")])}</table>
<h2>ניכויים</h2><table>{head}{tbl(ded)}</table>
<h2>זיכויים/ניכויים</h2><table>{head}{tbl([("", "ערך נקודות זיכוי " + str(points), f"{pts_value:,}")])}</table>
<h2>סיווג הכנסות</h2><table>{head}{tbl(classes)}</table>
<h2>פירוט קופות</h2><table><tr><th>קופה</th><th>שם</th><th>סוג הקופה</th><th>ברוטו להפרשה</th><th>שיעור ההפרשה</th><th>הפרשת מעסיק</th></tr>{fr}</table>
<h2>הצהרת מעסיק</h2><div class=box>אנו מאשרים בזה כי העובד עבד אצלנו בתקופה שצוינה לעיל.</div>"""

# A (2023): full year, tax right. Planted: employer pension only 6% (law: 6.5%).
A = form(2023, 'מאפיית הגליל בע"מ', "ישראל ישראלי ת.ז 000000018", [1] * 12,
    [("158/172", "משכורת", "150,000"), ("", 'סה"כ תשלומים', "150,000")],
    [("042", "מס הכנסה", "10,540"), ("", "ביטוח לאומי", "5,820"), ("", "מס בריאות", "6,960"), ("045/086", 'קצבה כ"עמית שכיר"', "9,000")],
    2.25, 6345,
    [("", "כיסוי הוצאות", "0"), ("", 'ש"נ ושכר מיוחד', "0"), ("", "שכר החייב ביטוח לאומי", "150,000")],
    [("", "מגדל", "קופת גמל לקצבה", "150,000", "6.00", "9,000"), ("", "מגדל", "קופת גמל לפיצויים", "150,000", "6.00", "9,000")], 18000, 150000)
# B (2022): 5 months, refund. Overtime and expenses: pension only on 35,000.
B = form(2022, 'רשת חנויות דוגמה בע"מ', "נועה כהן ת.ז 000000026", [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    [("158/172", "משכורת", "40,000")],
    [("042", "מס הכנסה", "1,850"), ("", "ביטוח לאומי", "1,120"), ("", "מס בריאות", "1,240"), ("045/086", 'קצבה כ"עמית שכיר"', "2,100"), ("", "קרן השתלמות", "875")],
    2.75, 3066,
    [("", "כיסוי הוצאות", "1,000"), ("", 'ש"נ ושכר מיוחד', "4,000"), ("", "שכר החייב ביטוח לאומי", "40,000")],
    [("", "הראל", "קופת גמל לקצבה", "35,000", "6.50", "2,275"), ("", "הראל", "קופת גמל לפיצויים", "35,000", "6.00", "2,100"), ("", "אלטשולר", "קרן השתלמות", "35,000", "7.50", "2,625")], 4375, 35000)
# C (2025): full year, tax too low (orange "owe").
C = form(2025, 'טכנולוגיות דוגמה בע"מ', "דן לוי ת.ז 000000034", [1] * 12,
    [("158/172", "משכורת", "230,000")],
    [("042", "מס הכנסה", "26,600"), ("", "ביטוח לאומי", "14,400"), ("", "מס בריאות", "11,300"), ("045/086", 'קצבה כ"עמית שכיר"', "13,800"), ("037", "תרומות", "1,000")],
    2.25, 6534,
    [("", "כיסוי הוצאות", "0"), ("", 'ש"נ ושכר מיוחד', "0"), ("", "שכר החייב ביטוח לאומי", "230,000")],
    [("", "כלל", "קופת גמל לקצבה", "230,000", "6.50", "14,950"), ("", "כלל", "קופת גמל לפיצויים", "230,000", "8.33", "19,159")], 34109, 230000)

out = os.path.join(os.path.dirname(__file__), "..", "test-docs")
for name, html in (("f106_a", A), ("f106_b", B), ("f106_c", C)):
    io.open(os.path.join(out, name + ".html"), "w", encoding="utf-8").write(html)
print("ok")
# PDF:  msedge --headless=new --no-pdf-header-footer --print-to-pdf=<abs>.pdf file:///<abs>.html
# PNG:  msedge --headless=new --window-size=900,1350 --screenshot=<abs>.png file:///<abs>.html
