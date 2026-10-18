const projects = window.portfolioProjects;
const grid = document.querySelector('#project-grid');
const dialog = document.querySelector('#project-dialog');
const dialogContent = document.querySelector('#dialog-content');
const search = document.querySelector('#project-search');
const yearFilter = document.querySelector('#year-filter');
const sort = document.querySelector('#project-sort');
const reset = document.querySelector('#reset-filters');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset = filename => `assets/${filename}`;
const featured = projects.find(p => p.featured) || projects[0];
const categories = {event:'Event graphics',presentations:'Presentations',past:'Past presentations',identity:'Brand identity',digital:'Social & digital',print:'Print & merchandise'};
let category = 'all';
let currentProject, lastProjectTrigger, galleryIndex = 0, galleryGroup = 'All images', galleryView = 'slideshow';
const categoryMatches = (p, value) => value === 'all' || (p.categories || [p.category]).includes(value);
function picture(item, title, thumbnail = false, lazy = true) {
  return `<img src="${asset(thumbnail ? item.thumbnail || item.image : item.image)}" alt="${escapeHtml(item.alt || title)}" ${lazy ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"${item.width ? ` width="${item.width}" height="${item.height}"` : ''}>`;
}
function renderProjects() {
  const query = search.value.trim().toLocaleLowerCase();
  const shown = projects.filter(p => categoryMatches(p, category) && (yearFilter.value === 'all' || p.year === yearFilter.value) && (!query || [p.title,p.discipline,p.description,p.scope,...(p.categories || []).map(c=>categories[c])].join(' ').toLocaleLowerCase().includes(query)));
  shown.sort((a,b) => sort.value === 'name' ? a.title.localeCompare(b.title) : sort.value === 'oldest' ? a.date.localeCompare(b.date) : Number(!!b.featured)-Number(!!a.featured) || b.date.localeCompare(a.date));
  grid.innerHTML = shown.length ? shown.map(p => `<article class="project-card"><button class="project-button" data-project="${p.id}" aria-label="Explore ${escapeHtml(p.title)}, ${p.gallery.length} images"><div class="project-image${p.light ? ' image-light' : ''}">${picture(p,p.title,true)}<span class="project-type">${escapeHtml(p.type)}</span></div><div class="project-info"><div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.discipline)}</p></div><span>${escapeHtml(p.year)}</span></div><div class="card-gallery-line"><span><b>${String(p.gallery.length).padStart(2,'0')}</b> images to explore</span><span>View project ↗</span></div></button></article>`).join('') : '<div class="empty-library"><h3>No projects found.</h3><p>Try another search or clear the filters.</p></div>';
  document.querySelector('#filter-status').textContent = `${shown.length} of ${projects.length} projects · ${shown.reduce((n,p)=>n+p.gallery.length,0)} images${query ? ` · Search: “${search.value.trim()}”` : ''}`;
  reset.hidden = category === 'all' && yearFilter.value === 'all' && !query;
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.filter === category)));
}
for (const year of [...new Set(projects.map(p=>p.year))].sort().reverse()) yearFilter.insertAdjacentHTML('beforeend',`<option value="${escapeHtml(year)}">${escapeHtml(year)}</option>`);
document.querySelectorAll('[data-filter]').forEach(button => {
  button.querySelector('span').textContent = projects.filter(p=>categoryMatches(p,button.dataset.filter)).length;
  button.addEventListener('click',()=>{category=button.dataset.filter;renderProjects();history.replaceState(null,'',category==='all'?'#work':`#work/${category}`);});
});
search.addEventListener('input',renderProjects);
yearFilter.addEventListener('change',renderProjects);
sort.addEventListener('change',renderProjects);
reset.addEventListener('click',()=>{category='all';yearFilter.value='all';search.value='';renderProjects();history.replaceState(null,'','#work');search.focus();});
document.querySelector('#hero-image').src = asset(featured.heroImage || featured.image);
document.querySelector('#hero-image').alt = featured.alt;
document.querySelector('#hero-project-name').textContent = featured.heroLabel || featured.title;
document.querySelector('.hero-project').setAttribute('aria-label',`Explore ${featured.title}`);

function visibleImages() {
  return currentProject.gallery.map((image,index)=>({...image,index})).filter(g=>galleryGroup==='All images'||g.group===galleryGroup);
}
function renderGallery() {
  const images=visibleImages();
  galleryIndex=Math.max(0,Math.min(galleryIndex,images.length-1));
  const g=images[galleryIndex];
  const groups=['All images',...new Set(currentProject.gallery.map(g=>g.group))];
  document.querySelector('#project-gallery').innerHTML=`<div class="gallery-header"><h3>Project gallery <span>${currentProject.gallery.length} images</span></h3><div class="gallery-views" role="group" aria-label="Gallery view"><button data-view="slideshow" aria-pressed="${galleryView==='slideshow'}">Slideshow</button><button data-view="grid" aria-pressed="${galleryView==='grid'}">All images</button></div></div>${groups.length>2 ? `<div class="gallery-groups" role="group" aria-label="Gallery sections">${groups.map(group=>`<button data-group="${escapeHtml(group)}" aria-pressed="${galleryGroup===group}">${escapeHtml(group)} <span>${group==='All images'?currentProject.gallery.length:currentProject.gallery.filter(g=>g.group===group).length}</span></button>`).join('')}</div>`:''}${galleryView==='grid' ? `<div class="gallery-board">${images.map((g,i)=>`<button data-gallery-index="${i}" aria-label="View image ${i+1}: ${escapeHtml(g.caption)}">${picture(g,g.caption,true)}<p><b>${String(i+1).padStart(2,'0')}</b>${escapeHtml(g.caption)}</p></button>`).join('')}</div>` : `<div class="gallery-stage-wrap"><figure class="gallery-stage${g.light?' image-light':''}">${picture(g,g.caption,false,false)}<figcaption><span>${escapeHtml(g.caption)}</span><span class="slide-position" role="status" aria-live="polite">${galleryIndex+1} / ${images.length}</span></figcaption></figure></div><div class="gallery-controls"><div><button data-step="-1" aria-label="Previous image" ${galleryIndex===0?'disabled':''}>← Previous</button><button data-step="1" aria-label="Next image" ${galleryIndex===images.length-1?'disabled':''}>Next →</button></div><button data-expand aria-pressed="${dialog.classList.contains('gallery-expanded')}">${dialog.classList.contains('gallery-expanded')?'Exit large view':'Larger view'}</button><a href="${asset(g.image)}" target="_blank" rel="noopener noreferrer">Open image ↗</a></div><div class="gallery-thumbnails" aria-label="Choose an image">${images.map((g,i)=>`<button data-gallery-index="${i}" aria-label="Image ${i+1}: ${escapeHtml(g.caption)}" aria-current="${i===galleryIndex}">${picture(g,g.caption,true)}<span>${i+1}</span></button>`).join('')}</div><p class="gallery-key-hint">Use the arrow keys to browse · Esc to close</p>`}`;
  document.querySelectorAll('.gallery-board button').forEach((b,i)=>b.classList.toggle('image-light',!!images[i].light));
}
function openProject(project,trigger,updateHash=true) {
  if(!project)return;
  if(trigger)lastProjectTrigger=trigger;
  currentProject=project;galleryIndex=0;galleryGroup='All images';galleryView='slideshow';
  dialog.classList.remove('gallery-expanded');
  dialogContent.innerHTML=`<div class="dialog-intro"><span class="eyebrow">${escapeHtml(project.type.toUpperCase())} / ${escapeHtml(project.year)}</span><h2 id="dialog-title">${escapeHtml(project.title)}</h2><p>${escapeHtml(project.description)}</p><div class="project-meta"><div><span>MY CONTRIBUTION</span>${escapeHtml(project.scope)}</div>${project.context?`<div><span>CONTEXT</span>${escapeHtml(project.context)}</div>`:''}</div>${project.roleNote?`<p class="role-note">${escapeHtml(project.roleNote)}</p>`:''}</div><div id="project-gallery"></div><div class="dialog-footer"><a href="mailto:sadikw773@gmail.com">Let’s work together ↗</a><div class="project-direction-nav"><button data-next-project="-1">← Previous project</button><button data-next-project="1">Next project →</button></div></div>`;
  renderGallery();
  if(!dialog.open)dialog.showModal();
  dialog.scrollTop=0;
  document.body.classList.add('modal-open');
  if(updateHash)history.replaceState(null,'',`#project/${project.id}`);
}
document.addEventListener('click', event => {
  const projectButton=event.target.closest('[data-project]');
  if(projectButton){openProject(projectButton.dataset.project==='featured'?featured:projects.find(p=>p.id===projectButton.dataset.project),projectButton);return;}
  if(!dialog.open)return;
  const groupButton=event.target.closest('[data-group]');
  const viewButton=event.target.closest('[data-view]');
  const indexButton=event.target.closest('[data-gallery-index]');
  const stepButton=event.target.closest('[data-step]');
  const expandButton=event.target.closest('[data-expand]');
  const nextButton=event.target.closest('[data-next-project]');
  if(groupButton){galleryGroup=groupButton.dataset.group;galleryIndex=0;renderGallery();document.querySelector(`[data-group="${CSS.escape(galleryGroup)}"]`)?.focus({preventScroll:true});}
  if(viewButton){galleryView=viewButton.dataset.view;renderGallery();document.querySelector(`[data-view="${galleryView}"]`).focus({preventScroll:true});}
  if(indexButton){galleryIndex=Number(indexButton.dataset.galleryIndex);galleryView='slideshow';renderGallery();document.querySelector('.gallery-stage').scrollIntoView({block:'nearest',behavior:'smooth'});}
  if(stepButton){galleryIndex+=Number(stepButton.dataset.step);renderGallery();document.querySelector(`[data-step="${stepButton.dataset.step}"]`)?.focus({preventScroll:true});}
  if(expandButton){dialog.classList.toggle('gallery-expanded');renderGallery();dialog.scrollTop=0;document.querySelector('[data-expand]')?.focus({preventScroll:true});}
  if(nextButton){const index=projects.indexOf(currentProject);openProject(projects[(index+Number(nextButton.dataset.nextProject)+projects.length)%projects.length]);}
});
document.addEventListener('keydown',event=>{
  if(!dialog.open || galleryView!=='slideshow' || !['ArrowLeft','ArrowRight'].includes(event.key))return;
  if(event.target.closest('input,select,textarea'))return;
  event.preventDefault();
  galleryIndex+=event.key==='ArrowRight'?1:-1;
  renderGallery();
});
document.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');dialog.classList.remove('gallery-expanded');if(location.hash.startsWith('#project/'))history.replaceState(null,'',category==='all'?'#work':`#work/${category}`);lastProjectTrigger?.focus({preventScroll:true});});
function applyHash(){
  if(location.hash.startsWith('#project/')){const id=location.hash.slice(9);const project=projects.find(p=>p.id===id);if(project)openProject(project,undefined,false);return;}
  if(dialog.open)dialog.close();
  if(location.hash.startsWith('#work/')){const requested=location.hash.slice(6);if(categories[requested]){category=requested;renderProjects();requestAnimationFrame(()=>document.querySelector('#work').scrollIntoView());}}
}
window.addEventListener('hashchange',applyHash);
const menuButton=document.querySelector('.menu-toggle');
const mobileNav=document.querySelector('#mobile-nav');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');mobileNav.hidden=true;}
menuButton.addEventListener('click',()=>{const expanded=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!expanded));mobileNav.hidden=expanded;});
mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileNav.hidden){closeMenu();menuButton.focus();}});
window.matchMedia('(min-width:761px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
document.querySelector('.copy-email').addEventListener('click',async event=>{const button=event.currentTarget;try{await navigator.clipboard.writeText('sadikw773@gmail.com');button.textContent='Email copied ✓';document.querySelector('#copy-status').textContent='Email address copied to clipboard';setTimeout(()=>{button.innerHTML='Copy email <span aria-hidden="true">⧉</span>';},2500);}catch{document.querySelector('#copy-status').textContent='Copy unavailable. Select the email address above or use the email link.';button.textContent='Select email above to copy';}});
document.querySelector('#year').textContent=new Date().getFullYear();
renderProjects();
applyHash();
