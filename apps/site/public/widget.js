(function(){var e=/^https?:\/\//i;function t(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function n(e){let n=e.replace(/\r\n/g,`
`).split(`
`),i=[],a=[],o=null,s=null;function c(){a.length!==0&&(i.push(`<p>${a.join(` `)}</p>`),a=[])}function l(){o&&(i.push(`</${o}>`),o=null)}function u(e){o!==e&&(l(),i.push(`<${e}>`),o=e)}for(let e of n){if(e.match(/^```/)){s?(i.push(`<pre part="code-block"><code>${t(s.join(`
`).trim())}</code></pre>`),s=null):(c(),l(),s=[]);continue}if(s){s.push(e);continue}let n=e.trim();if(!n){c(),l();continue}let o=n.match(/^[-*]\s+(.+)/);if(o){c(),u(`ul`),i.push(`<li>${r(o[1]??``)}</li>`);continue}let d=n.match(/^\d+\.\s+(.+)/);if(d){c(),u(`ol`),i.push(`<li>${r(d[1]??``)}</li>`);continue}let f=n.match(/^#{1,4}\s+(.+)/);if(f){c(),l(),i.push(`<p><strong>${r(f[1]??``)}</strong></p>`);continue}l(),a.push(r(n))}return s&&i.push(`<pre part="code-block"><code>${t(s.join(`
`).trim())}</code></pre>`),c(),l(),i.join(``)}function r(n){return t(n).replace(/`([^`]+)`/g,`<code>$1</code>`).replace(/\*\*([^*]+)\*\*/g,`<strong>$1</strong>`).replace(/\*([^*]+)\*/g,`<em>$1</em>`).replace(/\[([^\]]+)]\(([^)]+)\)/g,(t,n,r)=>e.test(r)?`<a href="${r}" target="_blank" rel="noopener noreferrer">${n}</a>`:n)}var i=class extends Error{constructor(e){super(e),this.name=`Context7TransportError`}};async function a(e,t,n,r){let a=(await o(e,t,r)).body?.getReader();if(!a)throw new i(`No response stream was returned.`);let c=new TextDecoder,l=``;for(;;){let{done:e,value:t}=await a.read();if(e)break;l+=c.decode(t,{stream:!0});let r=l.split(`
`);l=r.pop()??``;for(let e of r)s(e,n)}l.trim()&&s(l,n)}async function o(e,t,n){let r;try{r=await fetch(new URL(`/api/v2/widget/chat`,f(e.apiUrl)),{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({libraryName:e.library,messages:t.map(e=>({id:e.id,role:e.role,content:e.content,parts:[{type:`text`,text:e.content}]}))}),signal:n})}catch(e){throw m(e)?e:new i(`Unable to connect to the Context7 chat service.`)}if(!r.ok)throw new i(await d(r));return r}function s(e,t){let n=e.trim();if(!n||n===`data: [DONE]`)return;if(n.startsWith(`data:`)){c(n.slice(5).trim(),t);return}let r=n.indexOf(`:`);if(r===-1)return;let i=n.slice(0,r),a=n.slice(r+1);if(i===`0`)try{let e=JSON.parse(a);typeof e==`string`&&t.onChunk(e),typeof e?.content==`string`&&t.onChunk(e.content),typeof e?.delta==`string`&&t.onChunk(e.delta)}catch{}}function c(e,t){try{let n=JSON.parse(e);if(n.type===`text-delta`&&typeof n.delta==`string`){t.onChunk(n.delta);return}if(n.type===`tool-input-available`){t.onToolCall?.(l(n));return}n.type===`tool-output-available`&&t.onToolResult?.(u(n))}catch{}}function l(e){return{args:p(e.input)?e.input:{},toolCallId:String(e.toolCallId??``),toolName:String(e.toolName??`tool`)}}function u(e){return{result:e.output,toolCallId:String(e.toolCallId??``)}}async function d(e){try{let t=await e.json();if(t.message===`Widget is not enabled`)return`The chat widget is not enabled for this library.`;if(t.message===`Origin not allowed`)return`This domain is not authorized to use the chat widget.`;if(t.message)return t.message}catch{}return`Context7 chat request failed with HTTP ${e.status}.`}function f(e){try{return new URL(e).origin}catch{return`https://context7.com`}}function p(e){return!!e&&typeof e==`object`&&!Array.isArray(e)}function m(e){return e instanceof DOMException&&e.name===`AbortError`}var h,g=new Map,_=`Hello! I'm here to help you with documentation for **{library}**.

Ask me about features, code examples, setup, configuration, API details, or best practices.`,v=typeof HTMLElement>`u`?class{}:HTMLElement,y=!1,b=class extends v{constructor(){super(),this.abortController=null,this.busy=!1,this.config=T(this),this.lastFocus=null,this.messageCounter=0,this.messages=[],this.registeredId=``,this.activeAnchorElement=null,this.toolCalls=new Map,this.triggerElement=null,this.onCustomTrigger=e=>{e.preventDefault(),this.activeAnchorElement=e.currentTarget instanceof Element?e.currentTarget:this.triggerElement,this.toggle()},this.onLauncherClick=e=>{this.activeAnchorElement=e.currentTarget instanceof Element?e.currentTarget:this.launcher,this.toggle()},this.onBackdropClick=e=>{e.target===this.backdrop&&this.config.closeOnOutsideClick&&this.close()},this.onDocumentPointerDown=e=>{if(!this.isOpen()||!this.config.closeOnOutsideClick)return;let t=e.composedPath();t.includes(this)||this.triggerElement&&t.includes(this.triggerElement)||this.close()},this.onFloatingLayout=()=>{this.isOpen()&&this.updateAnchorPosition()},this.onKeyDown=e=>{if(e.key===`Escape`&&this.isOpen()){e.preventDefault(),this.close();return}e.key!==`Tab`||!this.isOpen()||z(e,this.root)},this.root=this.attachShadow({mode:`open`}),this.renderShell()}connectedCallback(){this.syncConfig(),this.bindEvents(),this.bindCustomTrigger(),this.resetConversation(),this.register(),this.emit(`c7:ready`),this.config.defaultOpen&&this.open()}disconnectedCallback(){this.abortController?.abort(),this.unbindFloatingListeners(),this.unbindCustomTrigger(),this.unregister()}attributeChangedCallback(){let e=this.config.library;this.syncConfig(),this.updateStaticText(),this.bindCustomTrigger(),this.register(),this.messages.length<=1&&e!==this.config.library&&this.resetConversation(),this.config.defaultOpen&&!this.isOpen()?this.open():this.isOpen()&&(this.unbindFloatingListeners(),this.bindFloatingListeners(),this.updateAnchorPosition())}open(){this.isOpen()||(this.lastFocus=document.activeElement,this.updateAnchorPosition(),this.setAttribute(`open`,``),this.bindFloatingListeners(),this.emit(`c7:open`),window.setTimeout(()=>this.input?.focus(),20))}close(){this.isOpen()&&(this.removeAttribute(`open`),this.unbindFloatingListeners(),this.emit(`c7:close`),this.lastFocus instanceof HTMLElement&&this.lastFocus.focus())}toggle(){this.isOpen()?this.close():this.open()}isOpen(){return this.hasAttribute(`open`)}cancel(){this.abortController?.abort(),this.abortController=null,this.setBusy(!1)}async send(e){let r=(e??this.input?.value??``).trim();if(!r||this.busy)return;if(!this.config.library){this.appendError(`Missing data-library attribute.`);return}this.open(),this.setBusy(!0),this.input.value=``;let o={id:this.nextMessageId(),role:`user`,content:r};this.messages.push(o),this.appendMessage(`user`,t(r)),this.emit(`c7:question`,{message:o,messages:[...this.messages],question:r});let s=this.appendTyping(),c=``,l=null,u=!1;this.abortController=new AbortController;try{if(await a(this.config,this.messages,{onChunk:e=>{s.remove(),c+=e,l||(l=this.appendMessage(`assistant`,``)),l.innerHTML=n(c),u||(u=!0,this.emit(`c7:first-token`,{answer:c,question:r})),this.emit(`c7:answer`,{answer:c,question:r}),this.scrollToBottom()},onToolCall:e=>{s.remove(),this.appendToolCall(e),this.emit(`c7:tool-call`,{question:r,toolCall:e})},onToolResult:e=>{this.updateToolResult(e),this.emit(`c7:tool-result`,{question:r,toolResult:e})}},this.abortController.signal),s.remove(),c){let e={id:this.nextMessageId(),role:`assistant`,content:c};this.messages.push(e),this.emit(`c7:answer-complete`,{answer:c,message:e,messages:[...this.messages],question:r})}}catch(e){if(s.remove(),!B(e)){let t=e instanceof i||e instanceof Error?e.message:`Something went wrong.`;this.appendError(t),this.emit(`c7:error`,{error:t,question:r})}}finally{this.abortController=null,this.setBusy(!1),this.input?.focus()}}renderShell(){this.root.innerHTML=`
      <style>
  :host {
    --c7-accent: #059669;
    --c7-accent-contrast: #ffffff;
    --c7-backdrop: rgba(15, 23, 42, 0.46);
    --c7-backdrop-filter: none;
    --c7-border-color: #e7e5e4;
    --c7-control-background: #ffffff;
    --c7-control-border: #d6d3d1;
    --c7-control-color: #1c1917;
    --c7-error-background: #fef2f2;
    --c7-error-color: #991b1b;
    --c7-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --c7-footer-background: #fafaf9;
    --c7-focus-ring: color-mix(in srgb, var(--c7-accent) 22%, transparent);
    --c7-header-background: #fafaf9;
    --c7-launcher-background: var(--c7-accent);
    --c7-launcher-color: var(--c7-accent-contrast);
    --c7-launcher-gap: 8px;
    --c7-launcher-radius: 999px;
    --c7-launcher-shadow: 0 10px 28px rgba(15, 23, 42, 0.24);
    --c7-launcher-size: 56px;
    --c7-message-assistant-background: #f5f5f4;
    --c7-message-assistant-color: #1c1917;
    --c7-message-radius: 12px;
    --c7-message-user-background: var(--c7-accent);
    --c7-message-user-color: var(--c7-accent-contrast);
    --c7-muted-color: #78716c;
    --c7-panel-background: #ffffff;
    --c7-panel-backdrop-filter: none;
    --c7-panel-color: #1c1917;
    --c7-panel-height: min(600px, calc(100vh - 120px));
    --c7-panel-radius: 16px;
    --c7-panel-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
    --c7-panel-width: min(400px, calc(100vw - 32px));
    --c7-spacing: 16px;
    --c7-z-index: 2147483647;

    all: initial;
    color: var(--c7-panel-color);
    font-family: var(--c7-font-family);
    position: relative;
    z-index: var(--c7-z-index);
  }

  :host([theme="dark"]) {
    --c7-border-color: rgba(255, 255, 255, 0.14);
    --c7-control-background: #0b0b0c;
    --c7-control-border: rgba(255, 255, 255, 0.2);
    --c7-control-color: #f8fafc;
    --c7-error-background: rgba(127, 29, 29, 0.32);
    --c7-error-color: #fecaca;
    --c7-footer-background: #0e0e10;
    --c7-header-background: #0e0e10;
    --c7-message-assistant-background: #171717;
    --c7-message-assistant-color: #f5f5f5;
    --c7-muted-color: #a1a1aa;
    --c7-panel-background: #050505;
    --c7-panel-color: #f8fafc;
  }

  @media (prefers-color-scheme: dark) {
    :host([theme="auto"]) {
      --c7-border-color: rgba(255, 255, 255, 0.14);
      --c7-control-background: #0b0b0c;
      --c7-control-border: rgba(255, 255, 255, 0.2);
      --c7-control-color: #f8fafc;
      --c7-error-background: rgba(127, 29, 29, 0.32);
      --c7-error-color: #fecaca;
      --c7-footer-background: #0e0e10;
      --c7-header-background: #0e0e10;
      --c7-message-assistant-background: #171717;
      --c7-message-assistant-color: #f5f5f5;
      --c7-muted-color: #a1a1aa;
      --c7-panel-background: #050505;
      --c7-panel-color: #f8fafc;
    }
  }

  :host([preset="minimal"]) {
    --c7-accent: #2563eb;
    --c7-accent-contrast: #ffffff;
    --c7-backdrop: rgba(255, 255, 255, 0.54);
    --c7-border-color: #d4d4d4;
    --c7-footer-background: #ffffff;
    --c7-header-background: #ffffff;
    --c7-launcher-radius: 10px;
    --c7-launcher-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
    --c7-message-assistant-background: #f4f4f5;
    --c7-message-radius: 8px;
    --c7-panel-radius: 10px;
    --c7-panel-shadow: 0 18px 48px rgba(15, 23, 42, 0.16);
  }

  :host([preset="glass"]) {
    --c7-accent: #0d9488;
    --c7-accent-contrast: #ffffff;
    --c7-backdrop: rgba(4, 12, 18, 0.42);
    --c7-backdrop-filter: blur(12px);
    --c7-border-color: rgba(255, 255, 255, 0.2);
    --c7-control-background: rgba(255, 255, 255, 0.94);
    --c7-footer-background: rgba(255, 255, 255, 0.76);
    --c7-header-background: rgba(255, 255, 255, 0.76);
    --c7-launcher-background: color-mix(in srgb, var(--c7-accent) 86%, white);
    --c7-launcher-shadow: 0 18px 42px color-mix(in srgb, var(--c7-accent) 24%, rgba(15, 23, 42, 0.24));
    --c7-message-assistant-background: rgba(255, 255, 255, 0.82);
    --c7-panel-backdrop-filter: blur(18px);
    --c7-panel-background: rgba(255, 255, 255, 0.86);
    --c7-panel-radius: 18px;
    --c7-panel-shadow: 0 28px 90px rgba(15, 23, 42, 0.26);
  }

  :host([preset="neo"]) {
    --c7-accent: #facc15;
    --c7-accent-contrast: #101513;
    --c7-backdrop: rgba(253, 224, 71, 0.28);
    --c7-border-color: #111827;
    --c7-control-border: #111827;
    --c7-footer-background: #fff7c2;
    --c7-header-background: #fff7c2;
    --c7-launcher-radius: 12px;
    --c7-launcher-shadow: 6px 6px 0 #111827;
    --c7-message-assistant-background: #fef3c7;
    --c7-message-radius: 10px;
    --c7-panel-background: #fffef2;
    --c7-panel-radius: 12px;
    --c7-panel-shadow: 10px 10px 0 #111827;
  }

  :host([preset="terminal"]) {
    --c7-accent: #39ff88;
    --c7-accent-contrast: #06110b;
    --c7-backdrop: rgba(0, 0, 0, 0.62);
    --c7-border-color: rgba(57, 255, 136, 0.34);
    --c7-control-background: #030806;
    --c7-control-border: rgba(57, 255, 136, 0.28);
    --c7-control-color: #d6ffe6;
    --c7-footer-background: #07120c;
    --c7-font-family: "SF Mono", Monaco, Consolas, "Liberation Mono", monospace;
    --c7-header-background: #07120c;
    --c7-launcher-background: #07120c;
    --c7-launcher-color: #39ff88;
    --c7-launcher-radius: 7px;
    --c7-message-assistant-background: #0b1710;
    --c7-message-assistant-color: #d6ffe6;
    --c7-message-radius: 6px;
    --c7-muted-color: #8bdca8;
    --c7-panel-background: #030806;
    --c7-panel-color: #d6ffe6;
    --c7-panel-radius: 7px;
    --c7-panel-shadow: 0 24px 70px rgba(0, 0, 0, 0.46);
  }

  :host([preset="brutalist"]) {
    --c7-accent: #050505;
    --c7-accent-contrast: #f5f5f5;
    --c7-backdrop: rgba(255, 255, 255, 0.72);
    --c7-border-color: #050505;
    --c7-control-border: #050505;
    --c7-footer-background: #f5f5f5;
    --c7-header-background: #f5f5f5;
    --c7-launcher-radius: 0;
    --c7-launcher-shadow: 5px 5px 0 #050505;
    --c7-message-radius: 0;
    --c7-panel-radius: 0;
    --c7-panel-shadow: 8px 8px 0 #050505;
  }

  :host([theme="light"][preset="terminal"]) {
    --c7-accent: #047857;
    --c7-accent-contrast: #ffffff;
    --c7-backdrop: rgba(236, 253, 245, 0.62);
    --c7-border-color: rgba(4, 120, 87, 0.34);
    --c7-control-background: #ffffff;
    --c7-control-border: rgba(4, 120, 87, 0.32);
    --c7-control-color: #102018;
    --c7-footer-background: #ecfdf5;
    --c7-header-background: #ecfdf5;
    --c7-launcher-background: #ecfdf5;
    --c7-launcher-color: #047857;
    --c7-message-assistant-background: #dff8e8;
    --c7-message-assistant-color: #102018;
    --c7-muted-color: #3b7f58;
    --c7-panel-background: #f8fff9;
    --c7-panel-color: #102018;
    --c7-panel-shadow: 0 24px 70px rgba(4, 120, 87, 0.18);
  }

  @media (prefers-color-scheme: light) {
    :host([theme="auto"][preset="terminal"]) {
      --c7-accent: #047857;
      --c7-accent-contrast: #ffffff;
      --c7-backdrop: rgba(236, 253, 245, 0.62);
      --c7-border-color: rgba(4, 120, 87, 0.34);
      --c7-control-background: #ffffff;
      --c7-control-border: rgba(4, 120, 87, 0.32);
      --c7-control-color: #102018;
      --c7-footer-background: #ecfdf5;
      --c7-header-background: #ecfdf5;
      --c7-launcher-background: #ecfdf5;
      --c7-launcher-color: #047857;
      --c7-message-assistant-background: #dff8e8;
      --c7-message-assistant-color: #102018;
      --c7-muted-color: #3b7f58;
      --c7-panel-background: #f8fff9;
      --c7-panel-color: #102018;
      --c7-panel-shadow: 0 24px 70px rgba(4, 120, 87, 0.18);
    }
  }

  :host([theme="dark"][preset="minimal"]) {
    --c7-accent: #60a5fa;
    --c7-accent-contrast: #05070b;
    --c7-backdrop: rgba(0, 0, 0, 0.5);
    --c7-border-color: rgba(255, 255, 255, 0.16);
    --c7-control-background: #09090b;
    --c7-control-border: rgba(255, 255, 255, 0.18);
    --c7-control-color: #f8fafc;
    --c7-footer-background: #0f1115;
    --c7-header-background: #0f1115;
    --c7-message-assistant-background: #181b20;
    --c7-message-assistant-color: #f8fafc;
    --c7-muted-color: #a1a1aa;
    --c7-panel-background: #08090c;
    --c7-panel-color: #f8fafc;
    --c7-panel-shadow: 0 18px 48px rgba(0, 0, 0, 0.34);
  }

  :host([theme="dark"][preset="glass"]) {
    --c7-accent: #5eead4;
    --c7-accent-contrast: #042f2e;
    --c7-backdrop: rgba(0, 0, 0, 0.58);
    --c7-backdrop-filter: blur(12px);
    --c7-border-color: rgba(255, 255, 255, 0.18);
    --c7-control-background: rgba(8, 10, 14, 0.9);
    --c7-control-border: rgba(255, 255, 255, 0.2);
    --c7-control-color: #f8fafc;
    --c7-footer-background: rgba(11, 14, 18, 0.78);
    --c7-header-background: rgba(11, 14, 18, 0.78);
    --c7-message-assistant-background: rgba(255, 255, 255, 0.1);
    --c7-message-assistant-color: #f8fafc;
    --c7-muted-color: #cbd5e1;
    --c7-panel-background: rgba(10, 13, 17, 0.84);
    --c7-panel-color: #f8fafc;
  }

  :host([theme="dark"][preset="neo"]) {
    --c7-accent: #facc15;
    --c7-accent-contrast: #101513;
    --c7-backdrop: rgba(0, 0, 0, 0.58);
    --c7-border-color: #facc15;
    --c7-control-background: #090806;
    --c7-control-border: #facc15;
    --c7-control-color: #fef9c3;
    --c7-footer-background: #151207;
    --c7-header-background: #151207;
    --c7-launcher-shadow: 6px 6px 0 #facc15;
    --c7-message-assistant-background: #2b220d;
    --c7-message-assistant-color: #fef9c3;
    --c7-muted-color: #fde68a;
    --c7-panel-background: #090806;
    --c7-panel-color: #fef9c3;
    --c7-panel-shadow: 10px 10px 0 #facc15;
  }

  :host([theme="dark"][preset="brutalist"]) {
    --c7-accent: #f5f5f5;
    --c7-accent-contrast: #050505;
    --c7-backdrop: rgba(0, 0, 0, 0.68);
    --c7-border-color: #f5f5f5;
    --c7-control-background: #050505;
    --c7-control-border: #f5f5f5;
    --c7-control-color: #f5f5f5;
    --c7-footer-background: #050505;
    --c7-header-background: #050505;
    --c7-launcher-shadow: 5px 5px 0 #f5f5f5;
    --c7-message-assistant-background: #181818;
    --c7-message-assistant-color: #f5f5f5;
    --c7-muted-color: #d4d4d4;
    --c7-panel-background: #050505;
    --c7-panel-color: #f5f5f5;
    --c7-panel-shadow: 8px 8px 0 #f5f5f5;
  }

  @media (prefers-color-scheme: dark) {
    :host([theme="auto"][preset="minimal"]) {
      --c7-accent: #60a5fa;
      --c7-accent-contrast: #05070b;
      --c7-backdrop: rgba(0, 0, 0, 0.5);
      --c7-border-color: rgba(255, 255, 255, 0.16);
      --c7-control-background: #09090b;
      --c7-control-border: rgba(255, 255, 255, 0.18);
      --c7-control-color: #f8fafc;
      --c7-footer-background: #0f1115;
      --c7-header-background: #0f1115;
      --c7-message-assistant-background: #181b20;
      --c7-message-assistant-color: #f8fafc;
      --c7-muted-color: #a1a1aa;
      --c7-panel-background: #08090c;
      --c7-panel-color: #f8fafc;
      --c7-panel-shadow: 0 18px 48px rgba(0, 0, 0, 0.34);
    }

    :host([theme="auto"][preset="glass"]) {
      --c7-accent: #5eead4;
      --c7-accent-contrast: #042f2e;
      --c7-backdrop: rgba(0, 0, 0, 0.58);
      --c7-backdrop-filter: blur(12px);
      --c7-border-color: rgba(255, 255, 255, 0.18);
      --c7-control-background: rgba(8, 10, 14, 0.9);
      --c7-control-border: rgba(255, 255, 255, 0.2);
      --c7-control-color: #f8fafc;
      --c7-footer-background: rgba(11, 14, 18, 0.78);
      --c7-header-background: rgba(11, 14, 18, 0.78);
      --c7-message-assistant-background: rgba(255, 255, 255, 0.1);
      --c7-message-assistant-color: #f8fafc;
      --c7-muted-color: #cbd5e1;
      --c7-panel-background: rgba(10, 13, 17, 0.84);
      --c7-panel-color: #f8fafc;
    }

    :host([theme="auto"][preset="neo"]) {
      --c7-accent: #facc15;
      --c7-accent-contrast: #101513;
      --c7-backdrop: rgba(0, 0, 0, 0.58);
      --c7-border-color: #facc15;
      --c7-control-background: #090806;
      --c7-control-border: #facc15;
      --c7-control-color: #fef9c3;
      --c7-footer-background: #151207;
      --c7-header-background: #151207;
      --c7-launcher-shadow: 6px 6px 0 #facc15;
      --c7-message-assistant-background: #2b220d;
      --c7-message-assistant-color: #fef9c3;
      --c7-muted-color: #fde68a;
      --c7-panel-background: #090806;
      --c7-panel-color: #fef9c3;
      --c7-panel-shadow: 10px 10px 0 #facc15;
    }

    :host([theme="auto"][preset="brutalist"]) {
      --c7-accent: #f5f5f5;
      --c7-accent-contrast: #050505;
      --c7-backdrop: rgba(0, 0, 0, 0.68);
      --c7-border-color: #f5f5f5;
      --c7-control-background: #050505;
      --c7-control-border: #f5f5f5;
      --c7-control-color: #f5f5f5;
      --c7-footer-background: #050505;
      --c7-header-background: #050505;
      --c7-launcher-shadow: 5px 5px 0 #f5f5f5;
      --c7-message-assistant-background: #181818;
      --c7-message-assistant-color: #f5f5f5;
      --c7-muted-color: #d4d4d4;
      --c7-panel-background: #050505;
      --c7-panel-color: #f5f5f5;
      --c7-panel-shadow: 8px 8px 0 #f5f5f5;
    }
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  button, input {
    font: inherit;
  }

  .c7-backdrop {
    background: var(--c7-backdrop);
    backdrop-filter: var(--c7-backdrop-filter);
    inset: 0;
    opacity: 0;
    pointer-events: none;
    position: fixed;
    transition: opacity 180ms ease, visibility 180ms ease;
    visibility: hidden;
    z-index: var(--c7-z-index);
  }

  :host([open][backdrop-active]) .c7-backdrop {
    opacity: 1;
    pointer-events: auto;
    visibility: visible;
  }

  .c7-launcher {
    align-items: center;
    background: var(--c7-launcher-background);
    border: 0;
    border-radius: var(--c7-launcher-radius);
    bottom: 20px;
    box-shadow: var(--c7-launcher-shadow);
    color: var(--c7-launcher-color);
    cursor: pointer;
    display: flex;
    gap: var(--c7-launcher-gap);
    height: var(--c7-launcher-size);
    justify-content: center;
    padding: 0;
    position: fixed;
    right: 20px;
    transition: box-shadow 160ms ease, opacity 160ms ease, transform 160ms ease;
    width: var(--c7-launcher-size);
    z-index: calc(var(--c7-z-index) + 1);
  }

  .c7-launcher:hover {
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.3);
    transform: translateY(-1px);
  }

  .c7-launcher:focus-visible,
  .c7-close:focus-visible,
  .c7-send:focus-visible,
  .c7-input:focus-visible,
  .c7-tool-toggle:focus-visible {
    outline: 2px solid var(--c7-accent);
    outline-offset: 2px;
  }

  .c7-launcher svg {
    flex: none;
    height: calc(var(--c7-launcher-size) * 0.5);
    width: calc(var(--c7-launcher-size) * 0.5);
  }

  .c7-launcher-label {
    display: none;
    font-size: 14px;
    font-weight: 760;
    line-height: 1;
    white-space: nowrap;
  }

  :host([launcher-variant="pill"]) .c7-launcher {
    min-width: var(--c7-launcher-size);
    padding: 0 18px;
    width: auto;
  }

  :host([launcher-variant="pill"]) .c7-launcher-label,
  :host([launcher-variant="badge"]) .c7-launcher-label {
    display: inline;
  }

  :host([launcher-variant="badge"]) .c7-launcher {
    border-radius: 9px;
    height: 42px;
    min-width: 42px;
    padding: 0 12px;
    width: auto;
  }

  :host([launcher-variant="badge"]) .c7-launcher svg {
    height: 18px;
    width: 18px;
  }

  :host([position="bottom-left"]) .c7-launcher,
  :host([data-position="bottom-left"]) .c7-launcher {
    left: 20px;
    right: auto;
  }

  :host([position="top-right"]) .c7-launcher,
  :host([data-position="top-right"]) .c7-launcher {
    bottom: auto;
    top: 20px;
  }

  :host([position="top-left"]) .c7-launcher,
  :host([data-position="top-left"]) .c7-launcher {
    bottom: auto;
    left: 20px;
    right: auto;
    top: 20px;
  }

  :host([hide-default-button]) .c7-launcher,
  :host([data-hide-default-button="true"]) .c7-launcher {
    display: none;
  }

  .c7-panel {
    background: var(--c7-panel-background);
    backdrop-filter: var(--c7-panel-backdrop-filter);
    border: 1px solid var(--c7-border-color);
    border-radius: var(--c7-panel-radius);
    bottom: calc(20px + var(--c7-launcher-size) + 14px);
    box-shadow: var(--c7-panel-shadow);
    color: var(--c7-panel-color);
    display: flex;
    flex-direction: column;
    height: var(--c7-panel-height);
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    position: fixed;
    right: 20px;
    transform: translateY(12px) scale(0.98);
    transform-origin: bottom right;
    transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
    visibility: hidden;
    width: var(--c7-panel-width);
    z-index: calc(var(--c7-z-index) + 2);
  }

  :host([open]) .c7-panel {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
    visibility: visible;
  }

  :host([position="bottom-left"]) .c7-panel,
  :host([data-position="bottom-left"]) .c7-panel {
    left: 20px;
    right: auto;
    transform-origin: bottom left;
  }

  :host([position="top-right"]) .c7-panel,
  :host([data-position="top-right"]) .c7-panel {
    bottom: auto;
    top: calc(20px + var(--c7-launcher-size) + 14px);
    transform-origin: top right;
  }

  :host([position="top-left"]) .c7-panel,
  :host([data-position="top-left"]) .c7-panel {
    bottom: auto;
    left: 20px;
    right: auto;
    top: calc(20px + var(--c7-launcher-size) + 14px);
    transform-origin: top left;
  }

  :host([position="center"]) .c7-panel,
  :host([position="modal"]) .c7-panel {
    bottom: auto;
    left: 50%;
    max-height: calc(100vh - 32px);
    max-width: calc(100vw - 32px);
    right: auto;
    top: 50%;
    transform: translate(-50%, -46%) scale(0.96);
    transform-origin: center;
  }

  :host([open][position="center"]) .c7-panel,
  :host([open][position="modal"]) .c7-panel {
    transform: translate(-50%, -50%) scale(1);
  }

  :host([position="anchor"]) .c7-panel {
    bottom: auto;
    left: var(--c7-anchor-left, 20px);
    max-height: calc(100vh - 24px);
    max-width: calc(100vw - 24px);
    right: auto;
    top: var(--c7-anchor-top, 20px);
    transform: translateY(8px) scale(0.98);
    transform-origin: var(--c7-anchor-origin, top right);
  }

  :host([open][position="anchor"]) .c7-panel {
    transform: translateY(0) scale(1);
  }

  .c7-header {
    align-items: center;
    background: var(--c7-header-background);
    border-bottom: 1px solid var(--c7-border-color);
    display: flex;
    gap: 12px;
    justify-content: space-between;
    padding: 14px 16px;
  }

  .c7-title {
    color: var(--c7-panel-color);
    font-size: 15px;
    font-weight: 650;
    line-height: 1.2;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .c7-close {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 6px;
    color: var(--c7-muted-color);
    cursor: pointer;
    display: flex;
    height: 32px;
    justify-content: center;
    padding: 0;
    transition: background 120ms ease, color 120ms ease;
    width: 32px;
  }

  .c7-close:hover {
    background: color-mix(in srgb, var(--c7-muted-color) 12%, transparent);
    color: var(--c7-panel-color);
  }

  .c7-messages {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    padding: var(--c7-spacing);
    scrollbar-color: var(--c7-muted-color) transparent;
  }

  .c7-message {
    border-radius: var(--c7-message-radius);
    font-size: 14px;
    line-height: 1.5;
    max-width: 86%;
    overflow-wrap: anywhere;
    padding: 10px 13px;
  }

  .c7-message p {
    margin: 0 0 8px;
  }

  .c7-message p:last-child {
    margin-bottom: 0;
  }

  .c7-message ul,
  .c7-message ol {
    margin: 6px 0;
    padding-left: 20px;
  }

  .c7-message li {
    margin: 2px 0;
  }

  .c7-message code {
    background: color-mix(in srgb, var(--c7-muted-color) 18%, transparent);
    border-radius: 4px;
    font-family: "SF Mono", Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 0.92em;
    padding: 1px 5px;
  }

  .c7-message pre {
    background: #111827;
    border-radius: 8px;
    color: #e5e7eb;
    font-size: 12px;
    margin: 8px 0;
    overflow-x: auto;
    padding: 10px;
  }

  .c7-message pre code {
    background: transparent;
    padding: 0;
  }

  .c7-message a {
    color: var(--c7-accent);
  }

  .c7-message--assistant {
    align-self: flex-start;
    background: var(--c7-message-assistant-background);
    color: var(--c7-message-assistant-color);
    border-bottom-left-radius: 4px;
  }

  .c7-message--user {
    align-self: flex-end;
    background: var(--c7-message-user-background);
    color: var(--c7-message-user-color);
    border-bottom-right-radius: 4px;
  }

  .c7-message--error {
    align-self: center;
    background: var(--c7-error-background);
    color: var(--c7-error-color);
    font-size: 13px;
    max-width: 92%;
  }

  .c7-tool-call {
    align-self: flex-start;
    background: var(--c7-message-assistant-background);
    border-bottom-left-radius: 4px;
    border-radius: var(--c7-message-radius);
    color: var(--c7-message-assistant-color);
    font-size: 13px;
    max-width: 92%;
    padding: 10px 13px;
  }

  .c7-tool-header {
    align-items: center;
    color: var(--c7-muted-color);
    display: flex;
    gap: 8px;
  }

  .c7-tool-header svg {
    flex: none;
    height: 14px;
    width: 14px;
  }

  .c7-spinner {
    animation: c7-spin 1s linear infinite;
  }

  .c7-tool-result {
    border-top: 1px solid var(--c7-border-color);
    margin-top: 8px;
    padding-top: 8px;
  }

  .c7-tool-toggle {
    align-items: center;
    background: transparent;
    border: 0;
    color: var(--c7-accent);
    cursor: pointer;
    display: flex;
    gap: 4px;
    padding: 0;
  }

  .c7-tool-toggle svg {
    height: 14px;
    transition: transform 160ms ease;
    width: 14px;
  }

  .c7-tool-toggle[aria-expanded="true"] svg {
    transform: rotate(180deg);
  }

  .c7-tool-content {
    margin-top: 8px;
  }

  .c7-tool-content pre {
    background: #111827;
    border-radius: 8px;
    color: #e5e7eb;
    font-size: 11px;
    line-height: 1.45;
    margin: 0;
    max-height: 220px;
    overflow: auto;
    padding: 10px;
    white-space: pre-wrap;
  }

  .c7-typing {
    align-items: center;
    align-self: flex-start;
    background: var(--c7-message-assistant-background);
    border-bottom-left-radius: 4px;
    border-radius: var(--c7-message-radius);
    display: flex;
    gap: 4px;
    padding: 12px 13px;
  }

  .c7-typing span {
    animation: c7-bounce 1.4s infinite ease-in-out both;
    background: var(--c7-muted-color);
    border-radius: 50%;
    height: 6px;
    width: 6px;
  }

  .c7-typing span:nth-child(1) { animation-delay: -0.32s; }
  .c7-typing span:nth-child(2) { animation-delay: -0.16s; }

  .c7-composer {
    align-items: center;
    background: var(--c7-footer-background);
    border-top: 1px solid var(--c7-border-color);
    display: flex;
    gap: 8px;
    padding: 12px;
  }

  .c7-input {
    background: var(--c7-control-background);
    border: 1px solid var(--c7-control-border);
    border-radius: 10px;
    color: var(--c7-control-color);
    flex: 1;
    font-size: 16px;
    min-width: 0;
    outline: none;
    padding: 10px 12px;
  }

  .c7-input:focus {
    border-color: var(--c7-accent);
    box-shadow: 0 0 0 3px var(--c7-focus-ring);
  }

  .c7-input::placeholder {
    color: var(--c7-muted-color);
  }

  .c7-send {
    background: var(--c7-accent);
    border: 0;
    border-radius: 10px;
    color: var(--c7-accent-contrast);
    cursor: pointer;
    flex: none;
    font-size: 14px;
    font-weight: 650;
    min-height: 42px;
    padding: 0 16px;
    transition: opacity 120ms ease, transform 120ms ease;
  }

  .c7-send:hover {
    transform: translateY(-1px);
  }

  .c7-send:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    transform: none;
  }

  .c7-footer {
    align-items: center;
    background: var(--c7-footer-background);
    border-top: 1px solid var(--c7-border-color);
    display: flex;
    justify-content: center;
    min-height: 44px;
    padding: 8px 12px;
  }

  :host([hide-powered-by]) .c7-footer {
    display: none;
  }

  .c7-powered {
    align-items: center;
    color: var(--c7-muted-color);
    display: inline-flex;
    gap: 6px;
    font-size: 12px;
    text-decoration: none;
  }

  .c7-powered:hover {
    color: var(--c7-accent);
  }

  .c7-mark {
    align-items: center;
    background: var(--c7-panel-color);
    border-radius: 4px;
    color: var(--c7-panel-background);
    display: inline-flex;
    font-size: 10px;
    font-weight: 800;
    height: 20px;
    justify-content: center;
    line-height: 1;
    width: 20px;
  }

  @keyframes c7-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes c7-bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .c7-launcher,
    .c7-panel,
    .c7-backdrop,
    .c7-close,
    .c7-send,
    .c7-spinner,
    .c7-typing span {
      animation: none;
      transition: none;
    }
  }

  @media (max-width: 640px) {
    .c7-panel {
      border-bottom: 0;
      border-left: 0;
      border-radius: var(--c7-panel-radius) var(--c7-panel-radius) 0 0;
      border-right: 0;
      bottom: 0;
      height: min(82vh, 720px);
      left: 0;
      max-height: calc(100vh - 12px);
      right: 0;
      top: auto;
      transform: translateY(100%);
      transform-origin: bottom center;
      width: 100vw;
    }

    :host([open]) .c7-panel {
      transform: translateY(0);
    }

    :host([position="center"]) .c7-panel,
    :host([position="modal"]) .c7-panel,
    :host([position="anchor"]) .c7-panel {
      border: 1px solid var(--c7-border-color);
      border-radius: var(--c7-panel-radius);
      bottom: auto;
      height: min(var(--c7-panel-height), calc(100vh - 28px));
      max-height: calc(100vh - 28px);
      max-width: calc(100vw - 24px);
      right: auto;
      width: min(var(--c7-panel-width), calc(100vw - 24px));
    }

    :host([position="center"]) .c7-panel,
    :host([position="modal"]) .c7-panel {
      left: 50%;
      top: 50%;
      transform: translate(-50%, -46%) scale(0.96);
      transform-origin: center;
    }

    :host([open][position="center"]) .c7-panel,
    :host([open][position="modal"]) .c7-panel {
      transform: translate(-50%, -50%) scale(1);
    }

    :host([position="anchor"]) .c7-panel {
      left: var(--c7-anchor-left, 12px);
      top: var(--c7-anchor-top, 12px);
      transform: translateY(8px) scale(0.98);
      transform-origin: var(--c7-anchor-origin, top right);
    }

    :host([open][position="anchor"]) .c7-panel {
      transform: translateY(0) scale(1);
    }

    .c7-launcher {
      bottom: 16px;
      right: 16px;
    }

    .c7-composer {
      gap: 6px;
      padding: 10px;
    }

    .c7-input {
      font-size: 14px;
      padding-inline: 10px;
    }

    :host([position="bottom-left"]) .c7-launcher,
    :host([position="top-left"]) .c7-launcher,
    :host([data-position="bottom-left"]) .c7-launcher,
    :host([data-position="top-left"]) .c7-launcher {
      left: 16px;
      right: auto;
    }

    :host([position="top-right"]) .c7-launcher,
    :host([position="top-left"]) .c7-launcher,
    :host([data-position="top-right"]) .c7-launcher,
    :host([data-position="top-left"]) .c7-launcher {
      bottom: auto;
      top: 16px;
    }
  }
</style>
      <div class="c7-backdrop" data-c7-backdrop part="backdrop"></div>
      <section
        aria-label="Context7 documentation chat"
        aria-modal="false"
        class="c7-panel"
        part="panel"
        role="dialog"
      >
        <header class="c7-header" part="header">
          <div class="c7-title" data-c7-title part="title"></div>
          <button class="c7-close" data-c7-close part="close-button" type="button" aria-label="Close chat">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>
        <div class="c7-messages" data-c7-messages part="messages" aria-live="polite"></div>
        <form class="c7-composer" data-c7-form part="composer">
          <input class="c7-input" data-c7-input part="input" type="text" autocomplete="off" />
          <button class="c7-send" data-c7-send part="send-button" type="submit">Send</button>
        </form>
        <footer class="c7-footer" data-c7-footer part="footer">
          <a class="c7-powered" part="powered-by" href="https://context7.com" target="_blank" rel="noopener noreferrer">
            <span>Powered by</span>
            <span class="c7-mark" aria-hidden="true">7</span>
            <strong>Context7</strong>
          </a>
        </footer>
      </section>
      <button class="c7-launcher" data-c7-launcher part="launcher" type="button" aria-label="Open documentation chat">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 9h8" />
          <path d="M8 13h6" />
          <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12" />
        </svg>
        <span class="c7-launcher-label" data-c7-launcher-label></span>
      </button>
    `}bindEvents(){this.backdrop?.addEventListener(`click`,this.onBackdropClick),this.launcher?.addEventListener(`click`,this.onLauncherClick),this.closeButton?.addEventListener(`click`,()=>this.close()),this.form?.addEventListener(`submit`,e=>{e.preventDefault(),this.send()}),this.root.addEventListener(`keydown`,this.onKeyDown)}syncConfig(){this.config=T(this),I(this,`--c7-accent`,this.config.color),I(this,`--c7-panel-height`,this.config.panelHeight),I(this,`--c7-panel-width`,this.config.panelWidth),P(this,`anchor-placement`,this.config.anchorPlacement),P(this,`launcher-variant`,this.config.launcherVariant),P(this,`position`,this.config.position),P(this,`preset`,this.config.preset),P(this,`theme`,this.config.theme),F(this,`backdrop-active`,this.config.backdrop),F(this,`hide-default-button`,this.config.hideDefaultButton),F(this,`hide-powered-by`,!this.config.showPoweredBy)}updateStaticText(){this.titleElement&&(this.titleElement.textContent=this.config.title),this.input&&(this.input.placeholder=this.config.placeholder),this.launcherLabelElement&&(this.launcherLabelElement.textContent=this.config.launcherLabel),this.launcher&&this.launcher.setAttribute(`aria-label`,this.config.launcherLabel),this.panel&&(this.panel.setAttribute(`aria-label`,this.config.title),this.panel.setAttribute(`aria-modal`,String(this.config.position===`center`||this.config.position===`modal`))),this.footer&&(this.footer.hidden=!this.config.showPoweredBy)}resetConversation(){this.messages=[],this.toolCalls.clear(),this.messagesElement.innerHTML=``;let e=this.config.initialMessage.replace(/\{library\}/g,this.config.library||`this library`);this.appendMessage(`assistant`,n(e))}appendMessage(e,t){let n=document.createElement(`div`);return n.className=`c7-message c7-message--${e}`,n.setAttribute(`part`,`message ${e}-message`),n.innerHTML=t,this.messagesElement.append(n),this.scrollToBottom(),n}appendError(e){let t=document.createElement(`div`);t.className=`c7-message c7-message--error`,t.setAttribute(`part`,`message error-message`),t.innerHTML=R(e,this.config.library),this.messagesElement.append(t),this.scrollToBottom()}appendTyping(){let e=document.createElement(`div`);return e.className=`c7-typing`,e.setAttribute(`part`,`typing`),e.innerHTML=`<span></span><span></span><span></span>`,this.messagesElement.append(e),this.scrollToBottom(),e}appendToolCall(e){let n=document.createElement(`div`),r=typeof e.args.query==`string`?e.args.query:`documentation`;n.className=`c7-tool-call`,n.setAttribute(`part`,`tool-call`),n.innerHTML=`
      <div class="c7-tool-header">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <span>Searching: ${t(r)}</span>
        <svg class="c7-spinner" data-c7-tool-spinner viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
      </div>
    `,this.toolCalls.set(e.toolCallId,n),this.messagesElement.append(n),this.scrollToBottom()}updateToolResult(e){let n=this.toolCalls.get(e.toolCallId);if(!n)return;n.querySelector(`[data-c7-tool-spinner]`)?.remove();let r=typeof e.result==`string`?e.result:JSON.stringify(e.result,null,2);if(!r)return;let i=document.createElement(`div`);i.className=`c7-tool-result`,i.innerHTML=`
      <button class="c7-tool-toggle" part="tool-toggle" type="button" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 9 6 6 6-6"></path>
        </svg>
        <span>View results</span>
      </button>
      <div class="c7-tool-content" hidden>
        <pre>${t(r)}</pre>
      </div>
    `;let a=i.querySelector(`.c7-tool-toggle`),o=i.querySelector(`.c7-tool-content`);a?.addEventListener(`click`,()=>{if(!a||!o)return;let e=a.getAttribute(`aria-expanded`)===`true`;a.setAttribute(`aria-expanded`,String(!e)),o.hidden=e}),n.append(i),this.scrollToBottom()}setBusy(e){this.busy=e,this.input&&(this.input.disabled=e),this.sendButton&&(this.sendButton.disabled=e)}scrollToBottom(){this.messagesElement.scrollTop=this.messagesElement.scrollHeight}bindFloatingListeners(){document.addEventListener(`pointerdown`,this.onDocumentPointerDown,!0),this.config.position===`anchor`&&(window.addEventListener(`resize`,this.onFloatingLayout),window.addEventListener(`scroll`,this.onFloatingLayout,!0))}unbindFloatingListeners(){document.removeEventListener(`pointerdown`,this.onDocumentPointerDown,!0),window.removeEventListener(`resize`,this.onFloatingLayout),window.removeEventListener(`scroll`,this.onFloatingLayout,!0)}updateAnchorPosition(){if(this.config.position!==`anchor`)return;let e=this.getAnchorElement(),t=this.panel;if(!e||!t)return;let n=e.getBoundingClientRect(),r=t.offsetWidth||400,i=t.offsetHeight||600,a=window.innerWidth||document.documentElement.clientWidth||r,o=window.innerHeight||document.documentElement.clientHeight||i,s=n.right-r,c=n.bottom+12,l=`top right`;switch(this.config.anchorPlacement){case`bottom-start`:s=n.left,c=n.bottom+12,l=`top left`;break;case`top-end`:s=n.right-r,c=n.top-i-12,l=`bottom right`;break;case`top-start`:s=n.left,c=n.top-i-12,l=`bottom left`;break;case`right`:s=n.right+12,c=n.top+n.height/2-i/2,l=`left center`;break;case`left`:s=n.left-r-12,c=n.top+n.height/2-i/2,l=`right center`;break;default:s=n.right-r,c=n.bottom+12,l=`top right`;break}let u=Math.max(12,a-r-12),d=Math.max(12,o-i-12);s=L(s,12,u),c=L(c,12,d),this.style.setProperty(`--c7-anchor-left`,`${s}px`),this.style.setProperty(`--c7-anchor-top`,`${c}px`),this.style.setProperty(`--c7-anchor-origin`,l)}getAnchorElement(){return this.activeAnchorElement instanceof HTMLElement&&this.activeAnchorElement.isConnected?this.activeAnchorElement:this.triggerElement instanceof HTMLElement?this.triggerElement:this.launcher}bindCustomTrigger(){this.unbindCustomTrigger(),this.config.customTrigger&&(this.triggerElement=document.querySelector(this.config.customTrigger),this.triggerElement?.addEventListener(`click`,this.onCustomTrigger))}unbindCustomTrigger(){this.activeAnchorElement===this.triggerElement&&(this.activeAnchorElement=null),this.triggerElement?.removeEventListener(`click`,this.onCustomTrigger),this.triggerElement=null}nextMessageId(){return this.messageCounter+=1,`c7m-${this.messageCounter}`}register(){S(),this.registeredId&&this.registeredId!==this.config.widgetId&&g.delete(this.registeredId),g.set(this.config.widgetId,this),this.registeredId=this.config.widgetId}unregister(){this.registeredId&&(g.get(this.registeredId)===this&&g.delete(this.registeredId),this.registeredId=``)}emit(e,t={}){this.dispatchEvent(new CustomEvent(e,{bubbles:!0,composed:!0,detail:{library:this.config.library,widget:this,widgetId:this.config.widgetId,...t}}))}get closeButton(){return this.root.querySelector(`[data-c7-close]`)}get backdrop(){return this.root.querySelector(`[data-c7-backdrop]`)}get footer(){return this.root.querySelector(`[data-c7-footer]`)}get form(){return this.root.querySelector(`[data-c7-form]`)}get input(){return this.root.querySelector(`[data-c7-input]`)}get launcher(){return this.root.querySelector(`[data-c7-launcher]`)}get launcherLabelElement(){return this.root.querySelector(`[data-c7-launcher-label]`)}get messagesElement(){return this.root.querySelector(`[data-c7-messages]`)}get panel(){return this.root.querySelector(`.c7-panel`)}get sendButton(){return this.root.querySelector(`[data-c7-send]`)}get titleElement(){return this.root.querySelector(`[data-c7-title]`)}};h=b,h.observedAttributes=`anchor-placement.api-url.backdrop.close-on-outside-click.color.custom-trigger.data-anchor-placement.data-api-url.data-backdrop.data-close-on-outside-click.data-color.data-custom-trigger.data-default-open.data-hide-default-button.data-initial-message.data-launcher-label.data-launcher-variant.data-library.data-panel-height.data-panel-width.data-placeholder.data-position.data-preset.data-show-powered-by.data-theme.data-title.data-welcome-message.data-widget-id.default-open.hide-default-button.initial-message.launcher-label.launcher-variant.library.panel-height.panel-width.placeholder.position.preset.show-powered-by.theme.title.widget-id`.split(`.`);function x(e=`context7-widget`){typeof customElements>`u`||customElements.get(e)||customElements.define(e,b)}function S(){y||typeof window>`u`||(window.Context7Widget={instances:g,close:e=>w(C(e))?.close(),get:e=>C(e),isOpen:e=>w(C(e))?.isOpen()??!1,open:e=>w(C(e))?.open(),send:async(e,t)=>{await w(C(t))?.send(e)},toggle:e=>w(C(e))?.toggle()},y=!0)}function C(e){return e?g.get(e):g.get(`default`)??g.values().next().value}function w(e){return e instanceof b?e:void 0}function T(e){let t=E(e,`library`,`data-library`),n=D(E(e,`position`,`data-position`));return{anchorPlacement:O(E(e,`anchor-placement`,`data-anchor-placement`)),apiUrl:E(e,`api-url`,`data-api-url`)||`https://context7.com`,backdrop:M(e,n===`center`||n===`modal`,`backdrop`,`data-backdrop`),closeOnOutsideClick:M(e,!0,`close-on-outside-click`,`data-close-on-outside-click`),color:E(e,`color`,`data-color`),customTrigger:E(e,`custom-trigger`,`data-custom-trigger`),defaultOpen:M(e,!1,`default-open`,`data-default-open`),hideDefaultButton:M(e,!1,`hide-default-button`,`data-hide-default-button`),initialMessage:E(e,`initial-message`,`data-initial-message`,`welcome-message`,`data-welcome-message`)||_,launcherLabel:E(e,`launcher-label`,`data-launcher-label`)||`Ask Docs AI`,launcherVariant:k(E(e,`launcher-variant`,`data-launcher-variant`)),library:t,panelHeight:E(e,`panel-height`,`data-panel-height`),panelWidth:E(e,`panel-width`,`data-panel-width`),placeholder:E(e,`placeholder`,`data-placeholder`)||`Ask about the docs...`,position:n,preset:A(E(e,`preset`,`data-preset`)),showPoweredBy:M(e,!0,`show-powered-by`,`data-show-powered-by`),theme:j(E(e,`theme`,`data-theme`)),title:E(e,`title`,`data-title`)||`Chat with Documentation`,widgetId:E(e,`widget-id`,`data-widget-id`)||e.id||`default`}}function E(e,...t){for(let n of t){let t=e.getAttribute(n);if(t)return t.trim()}return``}function D(e){return e===`bottom-left`||e===`top-right`||e===`top-left`||e===`bottom-right`||e===`center`||e===`modal`||e===`anchor`?e:`bottom-right`}function O(e){return e===`bottom-start`||e===`top-end`||e===`top-start`||e===`right`||e===`left`?e:`bottom-end`}function k(e){return e===`pill`||e===`badge`?e:`icon`}function A(e){return e===`minimal`||e===`glass`||e===`neo`||e===`terminal`||e===`brutalist`?e:`default`}function j(e){return e===`light`||e===`dark`?e:`auto`}function M(e,t,...n){for(let t of n)if(e.hasAttribute(t))return!N(e.getAttribute(t));return t}function N(e){return e===`false`||e===`0`||e===`no`}function P(e,t,n){e.getAttribute(t)!==n&&e.setAttribute(t,n)}function F(e,t,n){n?e.hasAttribute(t)||e.setAttribute(t,``):e.removeAttribute(t)}function I(e,t,n){n?e.style.setProperty(t,n):e.style.removeProperty(t)}function L(e,t,n){return Math.min(Math.max(e,t),n)}function R(e,n){let r=t(e||`Something went wrong.`),i=n.startsWith(`/`)?n:`/${n}`;return`${r}<br><br>If you are the library owner, check your <a href="${t(encodeURI(`https://context7.com${i}/admin?tab=chat`))}" target="_blank" rel="noopener noreferrer">widget settings</a> on Context7.`}function z(e,t){let n=Array.from(t.querySelectorAll(`a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])`)).filter(e=>e.offsetParent!==null||e===t.activeElement);if(n.length===0)return;let r=n[0],i=n[n.length-1];if(!r||!i)return;let a=t.activeElement;e.shiftKey&&a===r?(e.preventDefault(),i.focus()):!e.shiftKey&&a===i&&(e.preventDefault(),r.focus())}function B(e){return e instanceof DOMException&&e.name===`AbortError`}var V=[[`data-anchor-placement`,`anchor-placement`],[`data-api-url`,`api-url`],[`data-backdrop`,`backdrop`],[`data-close-on-outside-click`,`close-on-outside-click`],[`data-color`,`color`],[`data-custom-trigger`,`custom-trigger`],[`data-default-open`,`default-open`],[`data-initial-message`,`initial-message`],[`data-launcher-label`,`launcher-label`],[`data-launcher-variant`,`launcher-variant`],[`data-library`,`library`],[`data-panel-height`,`panel-height`],[`data-panel-width`,`panel-width`],[`data-placeholder`,`placeholder`],[`data-position`,`position`],[`data-preset`,`preset`],[`data-show-powered-by`,`show-powered-by`],[`data-theme`,`theme`],[`data-title`,`title`],[`data-welcome-message`,`initial-message`],[`data-widget-id`,`widget-id`]];function H(e){if(!e||e.dataset.c7Mounted===`true`)return null;if(!e.getAttribute(`data-library`))return console.warn(`[Context7 Widget] Missing data-library attribute.`),null;x();let t=document.createElement(`context7-widget`);for(let[n,r]of V){let i=e.getAttribute(n);i!==null&&(t.setAttribute(n,i),t.setAttribute(r,i))}return t.hasAttribute(`api-url`)||t.setAttribute(`api-url`,`https://context7.com`),e.getAttribute(`data-hide-default-button`)===`true`&&(t.setAttribute(`data-hide-default-button`,`true`),t.setAttribute(`hide-default-button`,``)),e.dataset.c7Mounted=`true`,document.body.append(t),t}function U(){let e=document.currentScript;if(e instanceof HTMLScriptElement&&e.hasAttribute(`data-library`))return e;let t=document.querySelectorAll(`script[data-library]`);return t[t.length-1]??null}function W(){H(U())}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,W,{once:!0}):W()})();
//# sourceMappingURL=widget.js.map