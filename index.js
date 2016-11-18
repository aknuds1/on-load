/* global MutationObserver */
var document = require('global/document')
var window = require('global/window')
var watch = Object.create(null)
var KEY_ID = 'onloadid' + (new Date() % 9e6).toString(36)
var KEY_ATTR = 'data-' + KEY_ID
var INDEX = 0

if (window != null && window.MutationObserver != null) {
  var observer = new MutationObserver(function (mutations) {
    if (Object.keys(watch).length >= 1) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].attributeName === KEY_ATTR) {
          eachAttr(mutations[i], turnon, turnoff)
        } else {
          eachMutation(mutations[i].removedNodes, turnoff)
          eachMutation(mutations[i].addedNodes, turnon)
        }
      }
    }
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: [KEY_ATTR]
  })
}

module.exports = function onload (el, on, off, caller) {
  on = on || function () {}
  off = off || function () {}
  el.setAttribute(KEY_ATTR, 'o' + INDEX)
  watch['o' + INDEX] = [on, off, 0, caller || onload.caller]
  INDEX += 1
  return el
}

module.exports.KEY_ATTR = KEY_ATTR
module.exports.KEY_ID = KEY_ID

function turnon (index, el) {
  if (watch[index][0] && watch[index][2] === 0) {
    watch[index][0](el)
    watch[index][2] = 1
  }
}

function turnoff (index, el) {
  if (watch[index][1] && watch[index][2] === 1) {
    watch[index][1](el)
    watch[index][2] = 0
  }
}

function eachAttr (mutation, on, off) {
  var newKey = mutation.target.getAttribute(KEY_ATTR)
  if (mutation.oldValue != null && newKey != null && watch[mutation.oldValue][3] ===
      watch[newKey][3]) {
    // on-load has been called again by the same caller, transfer the old data to the new key
    watch[newKey] = watch[mutation.oldValue]
  } else {
    if (watch[mutation.oldValue]) {
      // on-load has been called for the same element by another caller
      off(mutation.oldValue, mutation.target)
    }
    if (watch[newKey]) {
      on(newKey, mutation.target)
    }
  }
}

function eachMutation (nodes, fn) {
  var keys = Object.keys(watch)
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] && nodes[i].getAttribute && nodes[i].getAttribute(KEY_ATTR)) {
      var onloadid = nodes[i].getAttribute(KEY_ATTR)
      keys.forEach(function (k) {
        if (onloadid === k) {
          fn(k, nodes[i])
        }
      })
    }
    if (nodes[i] && nodes[i].childNodes.length > 0) {
      eachMutation(nodes[i].childNodes, fn)
    }
  }
}
