"use strict";var Context7WidgetLoader=(()=>{var R=/^https?:\/\//i;function p(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function y(t){let r=t.replace(/\r\n/g,`
`).split(`
`),e=[],o=[],n=null,i=null;function a(){o.length!==0&&(e.push(`<p>${o.join(" ")}</p>`),o=[])}function c(){n&&(e.push(`</${n}>`),n=null)}function l(s){n!==s&&(c(),e.push(`<${s}>`),n=s)}for(let s of r){if(s.match(/^```/)){i?(e.push(`<pre part="code-block"><code>${p(i.join(`
`).trim())}</code></pre>`),i=null):(a(),c(),i=[]);continue}if(i){i.push(s);continue}let g=s.trim();if(!g){a(),c();continue}let w=g.match(/^[-*]\s+(.+)/);if(w){a(),l("ul"),e.push(`<li>${x(w[1]??"")}</li>`);continue}let C=g.match(/^\d+\.\s+(.+)/);if(C){a(),l("ol"),e.push(`<li>${x(C[1]??"")}</li>`);continue}let k=g.match(/^#{1,4}\s+(.+)/);if(k){a(),c(),e.push(`<p><strong>${x(k[1]??"")}</strong></p>`);continue}c(),o.push(x(g))}return i&&e.push(`<pre part="code-block"><code>${p(i.join(`
`).trim())}</code></pre>`),a(),c(),e.join("")}function x(t){return p(t).replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>").replace(/\[([^\]]+)]\(([^)]+)\)/g,(r,e,o)=>R.test(o)?`<a href="${o}" target="_blank" rel="noopener noreferrer">${e}</a>`:e)}var E=`
  :host {
    --c7-accent: #059669;
    --c7-accent-contrast: #ffffff;
    --c7-backdrop: transparent;
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
    --c7-launcher-color: #ffffff;
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

  *, *::before, *::after {
    box-sizing: border-box;
  }

  button, input {
    font: inherit;
  }

  .c7-backdrop {
    background: var(--c7-backdrop);
    inset: 0;
    pointer-events: none;
    position: fixed;
    z-index: var(--c7-z-index);
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
    height: calc(var(--c7-launcher-size) * 0.5);
    width: calc(var(--c7-launcher-size) * 0.5);
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

    :host([position]) .c7-panel {
      left: 0;
      right: 0;
      top: auto;
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
`;var h=class extends Error{constructor(r){super(r),this.name="Context7TransportError"}};async function M(t,r,e,o){let i=(await W(t,r,o)).body?.getReader();if(!i)throw new h("No response stream was returned.");let a=new TextDecoder,c="";for(;;){let{done:l,value:s}=await i.read();if(l)break;c+=a.decode(s,{stream:!0});let f=c.split(`
`);c=f.pop()??"";for(let g of f)T(g,e)}c.trim()&&T(c,e)}async function W(t,r,e){let o;try{o=await fetch(new URL("/api/v2/widget/chat",P(t.apiUrl)),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({libraryName:t.library,messages:r.map(n=>({id:n.id,role:n.role,content:n.content,parts:[{type:"text",text:n.content}]}))}),signal:e})}catch(n){throw F(n)?n:new h("Unable to connect to the Context7 chat service.")}if(!o.ok)throw new h(await D(o));return o}function T(t,r){let e=t.trim();if(!e||e==="data: [DONE]")return;if(e.startsWith("data:")){$(e.slice(5).trim(),r);return}let o=e.indexOf(":");if(o===-1)return;let n=e.slice(0,o),i=e.slice(o+1);if(n==="0")try{let a=JSON.parse(i);typeof a=="string"&&r.onChunk(a),typeof a?.content=="string"&&r.onChunk(a.content),typeof a?.delta=="string"&&r.onChunk(a.delta)}catch{}}function $(t,r){try{let e=JSON.parse(t);if(e.type==="text-delta"&&typeof e.delta=="string"){r.onChunk(e.delta);return}if(e.type==="tool-input-available"){r.onToolCall?.(q(e));return}e.type==="tool-output-available"&&r.onToolResult?.(O(e))}catch{}}function q(t){return{args:N(t.input)?t.input:{},toolCallId:String(t.toolCallId??""),toolName:String(t.toolName??"tool")}}function O(t){return{result:t.output,toolCallId:String(t.toolCallId??"")}}async function D(t){try{let r=await t.json();if(r.message==="Widget is not enabled")return"The chat widget is not enabled for this library.";if(r.message==="Origin not allowed")return"This domain is not authorized to use the chat widget.";if(r.message)return r.message}catch{}return`Context7 chat request failed with HTTP ${t.status}.`}function P(t){try{return new URL(t).origin}catch{return"https://context7.com"}}function N(t){return!!t&&typeof t=="object"&&!Array.isArray(t)}function F(t){return t instanceof DOMException&&t.name==="AbortError"}var u=new Map,U=`Hello! I'm here to help you with documentation for **{library}**.

Ask me about features, code examples, setup, configuration, API details, or best practices.`,j=typeof HTMLElement>"u"?class{}:HTMLElement,A=!1,v=class extends j{constructor(){super();this.abortController=null;this.busy=!1;this.config=L(this);this.lastFocus=null;this.messageCounter=0;this.messages=[];this.registeredId="";this.toolCalls=new Map;this.triggerElement=null;this.onCustomTrigger=e=>{e.preventDefault(),this.toggle()};this.onKeyDown=e=>{if(e.key==="Escape"&&this.isOpen()){e.preventDefault(),this.close();return}e.key!=="Tab"||!this.isOpen()||G(e,this.root)};this.root=this.attachShadow({mode:"open"}),this.renderShell()}static{this.observedAttributes=["api-url","color","custom-trigger","data-api-url","data-color","data-custom-trigger","data-hide-default-button","data-initial-message","data-library","data-placeholder","data-position","data-theme","data-title","data-widget-id","hide-default-button","initial-message","library","placeholder","position","theme","title","widget-id"]}connectedCallback(){this.syncConfig(),this.bindEvents(),this.resetConversation(),this.register(),this.emit("c7:ready")}disconnectedCallback(){this.abortController?.abort(),this.unbindCustomTrigger(),this.unregister()}attributeChangedCallback(){let e=this.config.library;this.syncConfig(),this.updateStaticText(),this.bindCustomTrigger(),this.register(),this.messages.length<=1&&e!==this.config.library&&this.resetConversation()}open(){this.isOpen()||(this.lastFocus=document.activeElement,this.setAttribute("open",""),this.emit("c7:open"),window.setTimeout(()=>this.input?.focus(),20))}close(){this.isOpen()&&(this.removeAttribute("open"),this.emit("c7:close"),this.lastFocus instanceof HTMLElement&&this.lastFocus.focus())}toggle(){this.isOpen()?this.close():this.open()}isOpen(){return this.hasAttribute("open")}cancel(){this.abortController?.abort(),this.abortController=null,this.setBusy(!1)}async send(e){let o=(e??this.input?.value??"").trim();if(!o||this.busy)return;if(!this.config.library){this.appendError("Missing data-library attribute.");return}this.open(),this.setBusy(!0),this.input.value="";let n={id:this.nextMessageId(),role:"user",content:o};this.messages.push(n),this.appendMessage("user",p(o)),this.emit("c7:question",{message:n,messages:[...this.messages],question:o});let i=this.appendTyping(),a="",c=null,l=!1;this.abortController=new AbortController;try{if(await M(this.config,this.messages,{onChunk:s=>{i.remove(),a+=s,c||(c=this.appendMessage("assistant","")),c.innerHTML=y(a),l||(l=!0,this.emit("c7:first-token",{answer:a,question:o})),this.emit("c7:answer",{answer:a,question:o}),this.scrollToBottom()},onToolCall:s=>{i.remove(),this.appendToolCall(s),this.emit("c7:tool-call",{question:o,toolCall:s})},onToolResult:s=>{this.updateToolResult(s),this.emit("c7:tool-result",{question:o,toolResult:s})}},this.abortController.signal),i.remove(),a){let s={id:this.nextMessageId(),role:"assistant",content:a};this.messages.push(s),this.emit("c7:answer-complete",{answer:a,message:s,messages:[...this.messages],question:o})}}catch(s){if(i.remove(),!V(s)){let f=s instanceof h||s instanceof Error?s.message:"Something went wrong.";this.appendError(f),this.emit("c7:error",{error:f,question:o})}}finally{this.abortController=null,this.setBusy(!1),this.input?.focus()}}renderShell(){this.root.innerHTML=`
      <style>${E}</style>
      <div class="c7-backdrop" part="backdrop"></div>
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
        <footer class="c7-footer" part="footer">
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
      </button>
    `}bindEvents(){this.launcher?.addEventListener("click",()=>this.toggle()),this.closeButton?.addEventListener("click",()=>this.close()),this.form?.addEventListener("submit",e=>{e.preventDefault(),this.send()}),this.root.addEventListener("keydown",this.onKeyDown)}syncConfig(){this.config=L(this),this.style.setProperty("--c7-accent",this.config.color),this.getAttribute("position")!==this.config.position&&this.setAttribute("position",this.config.position),this.getAttribute("theme")!==this.config.theme&&this.setAttribute("theme",this.config.theme),this.config.hideDefaultButton?this.hasAttribute("hide-default-button")||this.setAttribute("hide-default-button",""):H(this.getAttribute("data-hide-default-button"))||this.removeAttribute("hide-default-button")}updateStaticText(){this.titleElement&&(this.titleElement.textContent=this.config.title),this.input&&(this.input.placeholder=this.config.placeholder),this.panel&&this.panel.setAttribute("aria-label",this.config.title)}resetConversation(){this.messages=[],this.toolCalls.clear(),this.messagesElement.innerHTML="";let e=this.config.initialMessage.replace(/\{library\}/g,this.config.library||"this library");this.appendMessage("assistant",y(e))}appendMessage(e,o){let n=document.createElement("div");return n.className=`c7-message c7-message--${e}`,n.setAttribute("part",`message ${e}-message`),n.innerHTML=o,this.messagesElement.append(n),this.scrollToBottom(),n}appendError(e){let o=document.createElement("div");o.className="c7-message c7-message--error",o.setAttribute("part","message error-message"),o.innerHTML=J(e,this.config.library),this.messagesElement.append(o),this.scrollToBottom()}appendTyping(){let e=document.createElement("div");return e.className="c7-typing",e.setAttribute("part","typing"),e.innerHTML="<span></span><span></span><span></span>",this.messagesElement.append(e),this.scrollToBottom(),e}appendToolCall(e){let o=document.createElement("div"),n=typeof e.args.query=="string"?e.args.query:"documentation";o.className="c7-tool-call",o.setAttribute("part","tool-call"),o.innerHTML=`
      <div class="c7-tool-header">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <span>Searching: ${p(n)}</span>
        <svg class="c7-spinner" data-c7-tool-spinner viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
      </div>
    `,this.toolCalls.set(e.toolCallId,o),this.messagesElement.append(o),this.scrollToBottom()}updateToolResult(e){let o=this.toolCalls.get(e.toolCallId);if(!o)return;o.querySelector("[data-c7-tool-spinner]")?.remove();let n=typeof e.result=="string"?e.result:JSON.stringify(e.result,null,2);if(!n)return;let i=document.createElement("div");i.className="c7-tool-result",i.innerHTML=`
      <button class="c7-tool-toggle" part="tool-toggle" type="button" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 9 6 6 6-6"></path>
        </svg>
        <span>View results</span>
      </button>
      <div class="c7-tool-content" hidden>
        <pre>${p(n)}</pre>
      </div>
    `;let a=i.querySelector(".c7-tool-toggle"),c=i.querySelector(".c7-tool-content");a?.addEventListener("click",()=>{if(!a||!c)return;let l=a.getAttribute("aria-expanded")==="true";a.setAttribute("aria-expanded",String(!l)),c.hidden=l}),o.append(i),this.scrollToBottom()}setBusy(e){this.busy=e,this.input&&(this.input.disabled=e),this.sendButton&&(this.sendButton.disabled=e)}scrollToBottom(){this.messagesElement.scrollTop=this.messagesElement.scrollHeight}bindCustomTrigger(){this.unbindCustomTrigger(),this.config.customTrigger&&(this.triggerElement=document.querySelector(this.config.customTrigger),this.triggerElement?.addEventListener("click",this.onCustomTrigger))}unbindCustomTrigger(){this.triggerElement?.removeEventListener("click",this.onCustomTrigger),this.triggerElement=null}nextMessageId(){return this.messageCounter+=1,`c7m-${this.messageCounter}`}register(){_(),this.registeredId&&this.registeredId!==this.config.widgetId&&u.delete(this.registeredId),u.set(this.config.widgetId,this),this.registeredId=this.config.widgetId}unregister(){this.registeredId&&(u.get(this.registeredId)===this&&u.delete(this.registeredId),this.registeredId="")}emit(e,o={}){this.dispatchEvent(new CustomEvent(e,{bubbles:!0,composed:!0,detail:{library:this.config.library,widget:this,widgetId:this.config.widgetId,...o}}))}get closeButton(){return this.root.querySelector("[data-c7-close]")}get form(){return this.root.querySelector("[data-c7-form]")}get input(){return this.root.querySelector("[data-c7-input]")}get launcher(){return this.root.querySelector("[data-c7-launcher]")}get messagesElement(){return this.root.querySelector("[data-c7-messages]")}get panel(){return this.root.querySelector(".c7-panel")}get sendButton(){return this.root.querySelector("[data-c7-send]")}get titleElement(){return this.root.querySelector("[data-c7-title]")}};function S(t="context7-widget"){typeof customElements>"u"||customElements.get(t)||customElements.define(t,v)}function _(){if(A||typeof window>"u")return;let t={instances:u,close:r=>b(m(r))?.close(),get:r=>m(r),isOpen:r=>b(m(r))?.isOpen()??!1,open:r=>b(m(r))?.open(),send:async(r,e)=>{await b(m(e))?.send(r)},toggle:r=>b(m(r))?.toggle()};window.Context7Widget=t,A=!0}function m(t){return t?u.get(t):u.get("default")??u.values().next().value}function b(t){return t instanceof v?t:void 0}function L(t){let r=d(t,"library","data-library");return{apiUrl:d(t,"api-url","data-api-url")||"https://context7.com",color:d(t,"color","data-color")||"#059669",customTrigger:d(t,"custom-trigger","data-custom-trigger"),hideDefaultButton:t.hasAttribute("hide-default-button")||H(t.getAttribute("data-hide-default-button")),initialMessage:d(t,"initial-message","data-initial-message")||U,library:r,placeholder:d(t,"placeholder","data-placeholder")||"Ask about the docs...",position:K(d(t,"position","data-position")),theme:Y(d(t,"theme","data-theme")),title:d(t,"title","data-title")||"Chat with Documentation",widgetId:d(t,"widget-id","data-widget-id")||t.id||"default"}}function d(t,...r){for(let e of r){let o=t.getAttribute(e);if(o)return o.trim()}return""}function K(t){return t==="bottom-left"||t==="top-right"||t==="top-left"||t==="bottom-right"?t:"bottom-right"}function Y(t){return t==="light"||t==="dark"?t:"auto"}function H(t){return t===""||t==="true"||t==="1"}function J(t,r){let e=p(t||"Something went wrong."),o=r.startsWith("/")?r:`/${r}`,n=p(encodeURI(`https://context7.com${o}/admin?tab=chat`));return`${e}<br><br>If you are the library owner, check your <a href="${n}" target="_blank" rel="noopener noreferrer">widget settings</a> on Context7.`}function G(t,r){let e=Array.from(r.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(a=>a.offsetParent!==null||a===r.activeElement);if(e.length===0)return;let o=e[0],n=e[e.length-1],i=r.activeElement;t.shiftKey&&i===o?(t.preventDefault(),n.focus()):!t.shiftKey&&i===n&&(t.preventDefault(),o.focus())}function V(t){return t instanceof DOMException&&t.name==="AbortError"}var Q=[["data-api-url","api-url"],["data-color","color"],["data-custom-trigger","custom-trigger"],["data-initial-message","initial-message"],["data-library","library"],["data-placeholder","placeholder"],["data-position","position"],["data-theme","theme"],["data-title","title"],["data-widget-id","widget-id"]];function I(t){if(!t||t.dataset.c7Mounted==="true")return null;if(!t.getAttribute("data-library"))return console.warn("[Context7 Widget] Missing data-library attribute."),null;S();let e=document.createElement("context7-widget");for(let[o,n]of Q){let i=t.getAttribute(o);i&&(e.setAttribute(o,i),e.setAttribute(n,i))}return e.hasAttribute("api-url")||e.setAttribute("api-url","https://context7.com"),t.getAttribute("data-hide-default-button")==="true"&&(e.setAttribute("data-hide-default-button","true"),e.setAttribute("hide-default-button","")),t.dataset.c7Mounted="true",document.body.append(e),e}function z(){let t=document.currentScript;if(t instanceof HTMLScriptElement&&t.hasAttribute("data-library"))return t;let r=document.querySelectorAll("script[data-library]");return r[r.length-1]??null}function B(){I(z())}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",B,{once:!0}):B();})();
//# sourceMappingURL=widget.js.map
