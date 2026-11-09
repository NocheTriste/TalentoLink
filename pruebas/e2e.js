// Pruebas funcionales automatizadas + capturas de pantalla del prototipo TalentoLink
const { chromium } = require('playwright');
const URL = 'http://localhost:8765/';
const path = require('path');
const SH = path.join(__dirname, 'capturas') + path.sep; require('fs').mkdirSync(SH, {recursive:true});
const HV = path.join(__dirname, '..', 'hv_prueba.pdf'), FALSO = path.join(__dirname, 'falso.pdf'); require('fs').writeFileSync(FALSO, 'esto no es un pdf');
const results = [];
const errors = [];
function rec(id, nombre, ok, detalle){ results.push({id, nombre, ok, detalle}); console.log((ok?'PASS':'FAIL'), id, nombre, detalle||''); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport:{width:1366, height:800}, deviceScaleFactor:1.5, locale:'es-CO', acceptDownloads:true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if(m.type()==='error') errors.push(m.text()); });
  page.on('dialog', d => d.accept());
  const shot = async (n, full=false, clip=null) => { await page.waitForTimeout(350); await page.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove())); await page.screenshot({path: SH+n+'.png', fullPage: full, clip: clip||undefined}); };
  const go = async h => { await page.goto(URL + '#/' + h); await page.waitForTimeout(400); };

  await page.goto(URL); await page.waitForTimeout(1200);
  await shot('01_inicio');

  // Ofertas públicas
  await go('ofertas'); await shot('02_ofertas');

  // CP01-02 Registro
  await go('registro');
  await page.fill('#re','Panadería La Espiga S.A.S.'); await page.fill('#rn','900.555.123-4');
  await page.selectOption('#rs','Comercio'); await page.selectOption('#rci','Bogotá');
  await page.fill('#ra','Pedro Salas'); await page.fill('#rc','pedro@laespiga.co');
  await page.fill('#rp','abc'); await page.fill('#rp2','abc'); await page.check('#rt');
  await page.click('#fr button'); await page.waitForTimeout(300);
  const weak = await page.textContent('#rerr');
  rec('CP02','Registro rechaza contraseña débil', weak.includes('mínimo 8 caracteres'));
  await shot('03_registro_error');
  await page.fill('#rp','Espiga2026'); await page.fill('#rp2','Espiga2026');
  await page.click('#fr button'); await page.waitForTimeout(700);
  rec('CP01','Registro de empresa nueva e inicio de sesión automático', page.url().includes('vacantes/nueva'));

  // CP04 validación vacante
  await page.fill('#vt','Panadero'); await page.fill('#vs1','2000000'); await page.fill('#vs2','1800000');
  await page.fill('#vd','Elaboración de pan artesanal y productos de pastelería.'); await page.fill('#vr','Experiencia en panadería');
  await page.click('#fv button.primary'); await page.waitForTimeout(300);
  rec('CP04','Vacante: salario mínimo mayor que máximo es rechazado', (await page.textContent('#verr')).includes('no puede ser mayor'));
  await page.fill('#vs1','1500000'); await page.fill('#vs2','1900000');
  await shot('04_publicar_vacante');
  await page.click('#fv button.primary'); await page.waitForTimeout(600);
  await go('ofertas');
  rec('CP03','Vacante publicada aparece en el portal público', (await page.textContent('.joblist')).includes('Panadero'));
  await page.click('#logout').catch(()=>{});
  await go('panel'); // debería redirigir a login si hay sesión… cerrar sesión explícito
  if(!page.url().includes('login')){ await page.click('#logout'); await page.waitForTimeout(300); }

  // Postulación pública a "Auxiliar contable" (demo)
  await go('ofertas');
  await page.click('text=Auxiliar contable'); await page.waitForTimeout(500);
  await shot('05_oferta_formulario');
  const fill = async (doc) => {
    await page.fill('#pn','Carolina Mejía Rincón'); await page.fill('#pd',doc); await page.fill('#pt','3104567890');
    await page.fill('#pc','carolina.mejia@correo.co'); await page.selectOption('#pci','Bogotá'); await page.fill('#pe','4');
    await page.selectOption('#pes','Profesional'); await page.fill('#pa','2300000');
  };
  await fill('1032456789');
  await page.setInputFiles('#pf',HV);
  await page.click('#pbtn'); await page.waitForTimeout(400);
  rec('CP05','Postulación sin autorización de datos es rechazada', (await page.textContent('#perr')).includes('autorizar el tratamiento'));
  await page.setInputFiles('#pf',FALSO); await page.check('#pok');
  await page.click('#pbtn'); await page.waitForTimeout(400);
  rec('CP06','Archivo que no es PDF es rechazado', (await page.textContent('#perr')).includes('no es un PDF válido'));
  await page.uncheck('#pok'); await page.click('#pbtn'); await page.waitForTimeout(300);
  await page.locator('#perr').scrollIntoViewIfNeeded(); await shot('06_postulacion_validaciones');
  await page.setInputFiles('#pf',HV); await page.check('#pok');
  await page.click('#pbtn'); await page.waitForTimeout(800);
  const rad = (await page.textContent('#rad')).trim();
  rec('CP07','Postulación válida genera radicado', /^TL-\d{4}-\d{6}$/.test(rad), rad);
  await page.evaluate(()=>window.scrollTo(0,0)); await shot('07_postulacion_exitosa');
  // CP08 duplicada
  await page.goBack(); await page.waitForTimeout(200);
  await go('oferta/' + (await page.evaluate(()=>DB.vacantes.find(v=>v.titulo==='Auxiliar contable').id)));
  await fill('1032456789'); await page.setInputFiles('#pf',HV); await page.check('#pok');
  await page.click('#pbtn'); await page.waitForTimeout(400);
  rec('CP08','Postulación duplicada (mismo documento y vacante) es rechazada', (await page.textContent('#perr')).includes('Ya existe una postulación'));

  // CP09 login fallido + bloqueo
  await go('login');
  for(let i=0;i<5;i++){ await page.fill('#lc','reclutador@andina.co'); await page.fill('#lp','malaclave'+i); await page.click('#fl button'); await page.waitForTimeout(200); }
  await page.fill('#lp','Demo2026*'); await page.click('#fl button'); await page.waitForTimeout(300);
  const blk = await page.textContent('#lerr');
  rec('CP09','Bloqueo temporal tras 5 intentos fallidos de inicio de sesión', blk.includes('bloqueada temporalmente'));

  // CP10 login admin
  await page.fill('#lc','admin@andina.co'); await page.fill('#lp','Demo2026*'); await shot('08_login');
  await page.click('#fl button'); await page.waitForTimeout(700);
  rec('CP10','Inicio de sesión del administrador', page.url().includes('panel'));
  await shot('09_panel');

  await go('vacantes'); await shot('10_vacantes');

  // CP11 filtros
  await go('candidatos');
  await page.selectOption('#fe','3'); await page.selectOption('#fes','Profesional'); await page.waitForTimeout(300);
  const okF = await page.evaluate(()=>{ const r=filtrar(coPosts(),FILTROS).r; return r.length>0 && r.every(p=>p.experiencia>=3 && ESTUDIOS.indexOf(p.estudios)>=3); });
  rec('CP11','Filtros por experiencia y estudios devuelven solo candidatos que cumplen', okF, await page.textContent('#perf'));
  await shot('11_candidatos_filtros');
  await page.click('#fclear');

  // CP12 cambiar estado a entrevista
  await page.fill('#fx','Carolina Mejía'); await page.waitForTimeout(300);
  await page.click('#tb tr.click'); await page.waitForTimeout(900);
  await shot('12_detalle_candidato', false, {x:0,y:0,width:1366,height:560});
  await page.selectOption('#ms','entrevista');
  const d = new Date(Date.now()+3*86400000).toISOString().slice(0,10);
  await page.fill('#mfd', d); await page.fill('#mfh','10:00'); await page.fill('#mfl','Sede Chapinero, Cra 13 # 54-20');
  await page.fill('#mn','Por favor traer documento de identidad.');
  await page.click('#mok'); await page.waitForTimeout(500);
  const est = await page.evaluate(()=>{ const p=DB.postulaciones.find(x=>x.documento==='1032456789'); return {e:p.estado, h:p.historial.length, mail:DB.correos.some(c=>c.postId===p.id && c.asunto.startsWith('Actualización'))}; });
  rec('CP12','Cambio de estado a Entrevista registra historial y notifica al aspirante', est.e==='entrevista' && est.h===2 && est.mail);
  await shot('13_cambio_estado', false, {x:740,y:90,width:420,height:640});
  await page.keyboard.press('Escape');

  await go('notificaciones'); await shot('14_notificaciones');
  await go('reportes');
  const tc = await page.textContent('.kpis');
  rec('CP17','Reportes calculan postulaciones por vacante y tiempo promedio de cierre', /días/.test(tc) && (await page.$$('.bar')).length>=5);
  await shot('15_reportes', true);
  await go('usuarios'); await shot('16_usuarios');
  await go('empresa'); await shot('17_empresa');

  // CP14 pausar vacante
  await go('vacantes');
  const row = page.locator('tr', {hasText:'Asesor comercial'});
  await row.locator('[data-act=pausar]').click(); await page.waitForTimeout(400);
  await go('ofertas');
  const vis = (await page.textContent('.joblist')).includes('Asesor comercial');
  rec('CP14','Vacante pausada deja de aparecer en el portal público', !vis);
  await go('vacantes'); await page.locator('tr',{hasText:'Asesor comercial'}).locator('[data-act=reanudar]').click(); await page.waitForTimeout(300);

  // CP18 persistencia
  await page.reload(); await page.waitForTimeout(1200);
  const persist = await page.evaluate(()=>DB.postulaciones.some(x=>x.documento==='1032456789'));
  rec('CP18','Los datos se conservan al recargar el navegador', persist);

  // CP16 rendimiento 1000
  await go('empresa'); await page.click('#gen'); await page.waitForTimeout(800);
  await go('candidatos');
  const t = await page.evaluate(()=>{ const base=coPosts(); const t0=performance.now();
    const combos=[{exp:'2',est:'Tecnólogo',ciudad:'Bogotá',aspMax:'2500000'},{exp:'',est:'Profesional',ciudad:'',aspMax:''},{exp:'5',est:'',ciudad:'Cali',aspMax:''}];
    let n=0; for(const c of combos){ n+=filtrar(base,{texto:'',estado:'',orden:'recientes',...c}).r.length; } return {total:base.length, ms:(performance.now()-t0)/combos.length}; });
  await page.selectOption('#fe','2'); await page.selectOption('#fes','Tecnólogo'); await page.selectOption('#fci','Bogotá'); await page.selectOption('#fa','2500000'); await page.waitForTimeout(300);
  rec('CP16','Filtros con más de 1.000 hojas de vida responden en menos de 3 s', t.total>=1000 && t.ms<3000, `${t.total} HV, ${t.ms.toFixed(1)} ms promedio`);
  await shot('18_rendimiento_1000');
  await page.click('#logout'); await page.waitForTimeout(300);

  // CP13 consulta aspirante
  await go('consulta?r='+rad); await page.fill('#cd','1032456789'); await page.click('#fcq button'); await page.waitForTimeout(400);
  { const txt=await page.textContent('#cres'); const exp=await page.evaluate(d=>fecha(d), d); rec('CP13','El aspirante consulta su proceso y ve la fecha correcta de la entrevista', txt.includes('Entrevista programada') && txt.includes(exp) && exp.startsWith(d.slice(8,10)), exp); }
  await shot('19_consulta_aspirante');

  // CP15 permisos reclutador
  await go('login'); await page.fill('#lc','reclutador@andina.co'); await page.fill('#lp','Demo2026*');
  await page.evaluate(()=>{ for(const k in loginFails) delete loginFails[k]; });
  await page.click('#fl button'); await page.waitForTimeout(600);
  await go('usuarios'); await page.waitForTimeout(300);
  const blocked1 = page.url().includes('panel');
  await go('vacantes/nueva'); await page.waitForTimeout(300);
  const blocked2 = page.url().includes('panel');
  const hasNav = await page.$('a[href="#/usuarios"]');
  rec('CP15','El rol reclutador no accede a usuarios ni a crear vacantes', blocked1 && blocked2 && !hasNav);
  await go('vacantes'); await shot('20_vista_reclutador');

  // Móvil
  const m = await browser.newContext({ viewport:{width:390, height:844}, deviceScaleFactor:2, isMobile:true, locale:'es-CO' });
  const mp = await m.newPage(); mp.on('pageerror', e => errors.push(e.message));
  await mp.goto(URL + '#/ofertas'); await mp.waitForTimeout(1000); await mp.screenshot({path: SH+'21_movil_ofertas.png'});
  await mp.goto(URL + '#/oferta/' + 104); await mp.waitForTimeout(600); await mp.evaluate(()=>document.querySelector('#postbox').scrollIntoView()); await mp.waitForTimeout(300); await mp.screenshot({path: SH+'22_movil_formulario.png'});

  rec('CP19','Sin errores de JavaScript durante las pruebas', errors.length===0, errors.join(' | '));
  require('fs').writeFileSync(path.join(__dirname,'resultados.json'), JSON.stringify(results,null,2));
  await browser.close();
})();
