"""Exercise two-box rates, saved forms, unknown dates, outlets and a project subpath."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json, os, shutil, tempfile, threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
with tempfile.TemporaryDirectory() as temp:
 shutil.copytree(ROOT/'dist',Path(temp)/'parcelbench')
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=temp));threading.Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'));page=browser.new_page(viewport={'width':1200,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   def route(r):
    if '/rates?' in r.request.url:
     data={'quoteType':'counter','currency':'CAD','quotes':[{'code':'DOM.RP','name':'Regular Parcel','total':15,'base':12,'taxes':{'hst':2},'adjustments':[{'name':'Fuel','cost':1}],'options':[],'cubedWeight':2,'expectedDeliveryDate':None,'expectedTransitTime':None,'guaranteedDelivery':False}]}
    elif '/offices?' in r.request.url:data={'offices':[{'id':'123','name':'Test office <img>','location':'Counter','address':'Halifax, NS','coordinates':{'latitude':44.65,'longitude':-63.57},'distance':0.5,'hours':None},{'id':'456','name':'Second office','location':'Counter','address':'Halifax, NS','coordinates':None,'distance':1.2,'hours':None}]}
    elif 'id=456' in r.request.url:data={'hours':[]}
    else:data={'hours':[{'day':1,'times':['09:00','17:00']}]}
    r.fulfill(content_type='application/json',body=json.dumps({'fetched_at':'2026-11-25T12:00:00Z','data':data}),headers={'Access-Control-Allow-Origin':'*'})
   page.route('**/api/parcelbench/**',route);page.goto(f'http://127.0.0.1:{server.server_port}/parcelbench/');page.locator('#example').click();page.locator('#quote').click();page.locator('#quote-results').wait_for(state='visible');assert page.locator('.quote').count()==2;assert 'Delivery date not returned' in page.locator('#quotes').inner_text()
   page.locator('#save').click();page.reload();page.locator('#restore').click();assert page.locator('#origin').input_value()=='B3J 1S9';assert page.locator('#compare').is_checked();page.locator('#forget').click();assert page.locator('#restore').is_hidden()
   page.locator('#office-postal').fill('B3J1S9');page.locator('#find-offices').click();page.get_by_text('Test office <img>').wait_for();page.locator('.office').first.get_by_role('button',name='Load opening hours',exact=True).click();page.get_by_text('Sunday: 09:00–17:00',exact=False).wait_for();assert page.locator('img').count()==0
   second=page.locator('.office').nth(1);second.get_by_role('button',name='Load opening hours',exact=True).click();second.get_by_text('Opening hours are unavailable here.',exact=False).wait_for();assert second.get_by_role('link',name='Canada Post’s official finder').get_attribute('href')=='https://www.canadapost-postescanada.ca/cpc/en/tools/find-a-post-office.page'
   (ROOT/'browser-checks').mkdir(exist_ok=True);page.screenshot(path=str(ROOT/'browser-checks/desktop.png'),full_page=True);page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');page.screenshot(path=str(ROOT/'browser-checks/mobile.png'),full_page=True);assert not errors,errors;browser.close()
 finally:server.shutdown()
