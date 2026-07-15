Problem: a lot of people use context7 and its widget. Refs:
https://context7.com/docs/howto/chat-widget#next-js
https://github.com/search?q=https%3A%2F%2Fcontext7.com%2Fwidget.js&type=code
https://github.com/search?q=https%3A%2F%2Fcontext7.com%2Fwidget.js&type=commits
But it looks so ugly when this widget is integrated into amazing landing pages with not customizable styles. Example: attached screenshot of random project
Solution: Since context7 has MIT licence (https://github.com/upstash/context7/blob/master/LICENSE) I can try to improve their widget and create my own project related to context7-widget. I already did some customization for my own project: https://github.com/DeSource-Labs/phone-mask/blob/main/demo/public/vendor/context7-widget.fork.js
Thoughts about implementation:
Create a repo context7-widget
Use github actions and run scanner once per day. This scanner will download the original widget script: https://context7.com/widget.js and store it in the repo so we can track its changes. Once it's changed, github action will create the repo issue, that original script is updated, we need to parse it and update our own solution. Since I didn't even see that this widget script was updated, I don't think I will update our solution often.
Make great customizable widget script that can be integrated easily with any styles, theme support, events (devs can track that user interacted with widget, send some messages, etc => web app may send these data to some backend). We should support as many programming languages and integration points as we even can, not only web frameworks/js.
Once solution will be ready, create PRs in public github repositories for all context7 widget users with better replacement with their own project styles
I've also asked chatgpt deep research to analyze the usage of context7 widget, my idea and to provide comments, suggestions, pros and cons, limitations, risks, area of improvements - received context7-chatgpt-deepresearch.md
Prepare architecture, ci and implementation of my idea for simplest replacement ugly https://context7.com/widget.js by our https://context7.desource-labs.org/widget.js and maybe more tools. The key criteria of this project are simplicity, easiest integration, easies replacement of current context7 widget script, support of all possible styles of client design systems, and easy maintenance for me