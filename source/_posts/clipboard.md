---
title: 浏览器复制
date: 2023-07-08 13:36:01
tags: 
    - web
    - javascript
    - 剪切板
---

实现原理 Clipboard Api

https://developer.mozilla.org/zh-CN/docs/Web/API/Clipboard_API

```js
navigator.clipboard.readText().then(clipText => document.querySelector(".editor").innerText += clipText);
```

以前的做法是 `document.execCommand`

https://developer.mozilla.org/zh-CN/docs/Web/API/Document/execCommand

```js
bool = document.execCommand(aCommandName, aShowDefaultUI, aValueArgument)
```

现在已经废弃了，就看你是否要兼容老浏览器。

这里是组件的 clipboard-copy 的源码

https://github.com/feross/clipboard-copy/blob/master/index.js

```js
/*! clipboard-copy. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* global DOMException */

module.exports = clipboardCopy

function makeError () {
  return new DOMException('The request is not allowed', 'NotAllowedError')
}

async function copyClipboardApi (text) {
  // Use the Async Clipboard API when available. Requires a secure browsing
  // context (i.e. HTTPS)
  if (!navigator.clipboard) {
    throw makeError()
  }
  return navigator.clipboard.writeText(text)
}

async function copyExecCommand (text) {
  // Put the text to copy into a <span>
  const span = document.createElement('span')
  span.textContent = text

  // Preserve consecutive spaces and newlines
  span.style.whiteSpace = 'pre'
  span.style.webkitUserSelect = 'auto'
  span.style.userSelect = 'all'

  // Add the <span> to the page
  document.body.appendChild(span)

  // Make a selection object representing the range of text selected by the user
  const selection = window.getSelection()
  const range = window.document.createRange()
  selection.removeAllRanges()
  range.selectNode(span)
  selection.addRange(range)

  // Copy text to the clipboard
  let success = false
  try {
    success = window.document.execCommand('copy')
  } finally {
    // Cleanup
    selection.removeAllRanges()
    window.document.body.removeChild(span)
  }

  if (!success) throw makeError()
}

async function clipboardCopy (text) {
  try {
    await copyClipboardApi(text)
  } catch (err) {
    // ...Otherwise, use document.execCommand() fallback
    try {
      await copyExecCommand(text)
    } catch (err2) {
      throw (err2 || err || makeError())
    }
  }
}
```

就是两个做法的结合的封装