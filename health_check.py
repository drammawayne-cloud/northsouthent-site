#!/usr/bin/env python3
import subprocess,sys
BASE="https://northsouthent-site.pages.dev/"
ROUTES=["index","about","services","business-management","marketing","consulting","artists","events","partners","gallery","contact","account"]
fail=[]
for name in ROUTES:
 r=subprocess.run(["curl","-sSL","--max-time","20","-o","/dev/null","-w","%{http_code}",BASE+name+".html"],capture_output=True,text=True)
 good=r.returncode==0 and r.stdout=="200"
 print(("PASS" if good else "FAIL"),name,r.stdout,r.stderr[:100])
 if not good:fail.append(name)
print("Checked",len(ROUTES),"routes; failed:",len(fail))
sys.exit(bool(fail))
