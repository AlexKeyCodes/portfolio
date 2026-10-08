---
title: "Turbo Modals in Rails: One Frame, One Component, Zero Modal JavaScript in Your Views"
description: "A reusable modal pattern for Rails on the Hotwire stack. Links target a single modal Turbo Frame, controllers render ordinary views wrapped in a ViewComponent, and one small Stimulus controller handles opening, closing, validation errors, and cleanup."
date: 2026-10-08
tags: ["blog", "rails", "hotwire", "turbo", "stimulus", "viewcomponent"]
layout: layouts/blog-post.njk
permalink: "/blog/{{ title | slugify }}/"
---

{% raw %}
Every Rails app I've worked on eventually needs modals. A "New Widget" form, an "Edit" dialog, a confirmation step, a quick-view of a record. And in most of those apps, modals were the messiest part of the front end.

The usual approaches all have a cost:

- **Hidden modals baked into every page.** The markup is rendered up front whether the user opens it or not, the form is stale by the time they do, and every page that needs the modal has to carry it.
- **JavaScript that fetches a fragment and injects it.** Now you have a bespoke fetch-and-insert routine, and you're handling validation errors, redirects, and focus by hand.
- **A JSON endpoint plus a client-side form.** You've built a second app to avoid rendering a form you already know how to render.

With Hotwire, there's a much simpler option. Here's the pattern I've settled on, and it's the one I now drop into every new Rails project:

> A link points at a `modal` Turbo Frame. The controller renders an ordinary view wrapped in a `ModalComponent`. A small Stimulus controller handles show, hide, auto-close on success, and cleanup. **Views never contain modal JavaScript.**

The controller doesn't know it's serving a modal. The view barely knows. You write normal Rails, and it shows up in a modal.

## Why this pattern is worth it

Before the code, here's what you get:

| Benefit | What it means in practice |
|---|---|
| **Controllers stay boring** | `new` renders, `create` redirects on success and renders `422` on failure. That's standard Rails scaffolding, unchanged. |
| **Validation errors for free** | A failed submit re-renders the form in the modal with errors, using the same view you already wrote. |
| **One line to open a modal** | Any link becomes a modal link by adding `data: { turbo_frame: "modal" }`. |
| **No modal markup on the page until needed** | The layout carries one empty frame. Content is fetched fresh every time the modal opens. |
| **One place for modal behaviour** | All of the open/close/cleanup logic lives in a single Stimulus controller. Fix a bug once, and it's fixed everywhere. |
| **Consistent UI** | Every modal shares one component, so the header, close button, sizing, and accessibility attributes are identical across the app. |

The examples use Bootstrap 5 for the modal itself, because Bootstrap handles the backdrop, focus trap, ESC key, and animations. The underlying idea (frame + component + lifecycle-driven controller) carries over to any modal library, or to a native `<dialog>`.

## Prerequisites

- Rails 7.1+ with `turbo-rails` and `stimulus-rails`
- The `view_component` gem
- Bootstrap 5 (JS and CSS) bundled with esbuild or importmap, with `@popperjs/core` installed
- Stimulus controllers registered in `app/javascript/controllers/index.js`

Your JavaScript entry point needs Turbo and Bootstrap:

```js
// app/javascript/application.js
import "@hotwired/turbo-rails"
import "./controllers"
import * as bootstrap from "bootstrap"
```

## The three pieces

The whole system is three small files.

### 1. An empty frame in the layout

Every page gets one empty `modal` frame. Put it inside `<body>`, outside any other frame, after the main content:

```erb
<%# app/views/layouts/application.html.erb %>
<body>
  <%= yield %>
  <%= turbo_frame_tag "modal" %>
</body>
```

This is the landing pad. It's empty until a link targets it.

### 2. The `ModalComponent`

The component wraps whatever content you give it in Bootstrap modal markup, inside a Turbo Frame that's *also* called `modal`:

```ruby
# app/components/modal_component.rb
class ModalComponent < ViewComponent::Base
  include Turbo::FramesHelper

  def initialize(title:)
    @title = title
  end
end
```

```erb
<%# app/components/modal_component.html.erb %>
<%= turbo_frame_tag "modal" do %>
  <div class="modal fade"
       id="modal"
       tabindex="-1"
       aria-labelledby="modalLabel"
       aria-hidden="true"
       data-bs-backdrop="static"
       data-bs-keyboard="true"
       data-controller="turbo-modal"
       data-action="turbo:submit-end->turbo-modal#submitEnd hidden.bs.modal->turbo-modal#cleanup">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title fs-5" id="modalLabel">
            <%= @title %>
          </h2>
          <button type="button"
                  class="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close">
          </button>
        </div>
        <div class="modal-body">
          <%= content %>
        </div>
      </div>
    </div>
  </div>
<% end %>
```

This is the key insight behind the pattern. When the response comes back, Turbo finds the `turbo-frame id="modal"` in it, matches it against the empty frame in the layout, and swaps in the inner markup. Because the element with `data-controller="turbo-modal"` lives *inside* the frame, **Stimulus connects the controller when the content lands and disconnects it when the frame is emptied or replaced.**

That connect/disconnect lifecycle is what drives everything else. We never need to write "when the modal opens, do X" glue. The modal opening *is* the controller connecting.

### 3. The Stimulus controller

```js
// app/javascript/controllers/turbo_modal_controller.js
import { Controller } from '@hotwired/stimulus'
import { Modal } from 'bootstrap'
import { Turbo } from '@hotwired/turbo-rails'

// Connects to data-controller="turbo-modal"
export default class extends Controller {
  connect() {
    this.modal = new Modal(this.element, {
      backdrop: 'static',
      keyboard: true,
      focus: true,
    })
    this.boundBeforeFetchResponse = this.beforeFetchResponse.bind(this)
    document.addEventListener('turbo:before-fetch-response', this.boundBeforeFetchResponse)
    this.show()
  }

  disconnect() {
    document.removeEventListener('turbo:before-fetch-response', this.boundBeforeFetchResponse)
    if (this.modal) {
      // A turbo_stream that replaces the #modal frame removes this element
      // without ever calling hide(). dispose() alone leaves the body class
      // and inline styles behind, which breaks page scrolling and anything
      // styled against `.modal-open`.
      document.body.classList.remove('modal-open')
      document.body.style.removeProperty('overflow')
      document.body.style.removeProperty('padding-right')
      this.modal.dispose()
    }
  }

  show() {
    this.modal.show()
  }

  hide() {
    this.modal.hide()
  }

  // Intercept successful redirect responses before Turbo processes them.
  // A form inside the modal that redirects would otherwise make Turbo look
  // for a `modal` frame in the redirected page and find it empty.
  beforeFetchResponse(event) {
    const response = event.detail.fetchResponse.response

    if (response.ok && response.redirected) {
      const formElement = event.target?.closest('form')
      const shouldClose = formElement?.dataset?.turboModalClose !== 'false'

      if (shouldClose) {
        event.preventDefault()
        Turbo.visit(response.url)
      }
    }
  }

  // Handle successful submissions that did not redirect (for example a
  // 200 turbo_stream response).
  submitEnd(event) {
    if (event.detail.success) {
      const fetchResponse = event.detail.fetchResponse
      if (!fetchResponse?.response?.redirected) {
        const formElement = event.detail.formSubmission?.formElement
        const shouldClose = formElement?.dataset?.turboModalClose !== 'false'
        if (shouldClose) {
          this.hide()
        }
      }
    }
  }

  // Empty the frame once Bootstrap has finished hiding the modal. Removing
  // the element triggers disconnect(), which disposes the Modal instance.
  cleanup() {
    const turboFrame = document.getElementById('modal')
    if (turboFrame) {
      turboFrame.innerHTML = ''
    }
  }
}
```

Register it:

```js
// app/javascript/controllers/index.js
import TurboModalController from './turbo_modal_controller'
application.register('turbo-modal', TurboModalController)
```

That's the whole system. Everything from here on is just using it.

## How it works

### Opening

A link with `data-turbo-frame="modal"` tells Turbo to fetch the URL and swap only the `modal` frame. The modal markup arrives, Stimulus connects `turbo-modal`, and `connect()` builds the Bootstrap `Modal` and shows it.

### Closing: three paths, one ending

There are three ways a modal closes. They all end the same way: the frame is emptied or replaced, the controller disconnects, and `disconnect()` disposes the Bootstrap instance and cleans up `<body>`.

1. **A form submit that redirects.** This is the standard Rails `create` → `redirect_to` flow. Left alone, Turbo would follow the redirect, look for a `modal` frame in the resulting page, find only the empty one from the layout, and swap that in, leaving you with a closed modal but a page that never updated. Instead, `beforeFetchResponse` sees an OK, redirected response, cancels Turbo's frame handling, and does a full `Turbo.visit` to the redirect URL. The new page arrives with its flash message and fresh data, and the modal is gone.
2. **A form submit that returns 200.** Usually a Turbo Stream response. `submitEnd` calls `hide()`, Bootstrap animates the modal out and fires `hidden.bs.modal`, `cleanup()` empties the frame, and `disconnect()` runs.
3. **The user dismisses it** with the close button, a Cancel button with `data-bs-dismiss="modal"`, or ESC. Bootstrap hides the modal and the same `hidden.bs.modal` → `cleanup()` → `disconnect()` path runs.

### Validation errors

This is my favourite part, because there's nothing to do. The controller re-renders `new` (or `edit`) with status `422`. Turbo swaps the `modal` frame with the fresh markup, which disconnects the old controller and connects a new one. The modal reappears with the errors displayed. You don't write any error-handling JavaScript at all.

### Closing from a Turbo Stream

If your `create` action responds with a stream instead of a redirect, perhaps to prepend the new record to a list without a full page visit, close the modal by replacing the frame with an empty one:

```erb
<%# app/views/widgets/create.turbo_stream.erb %>
<%= turbo_stream.replace "modal", turbo_frame_tag("modal") %>
<%= turbo_stream.prepend "widgets", partial: "widgets/widget", locals: { widget: @widget } %>
```

Removing the element triggers `disconnect()`, which handles the body cleanup. This is exactly why that cleanup lives in `disconnect()` rather than in `hide()`: a stream can rip the modal out of the DOM without Bootstrap ever being told to hide it.

### Keeping the modal open after a submit

Sometimes a form inside the modal *shouldn't* close it, like an inline list of notes where each submission updates its own frame. Opt out with `data-turbo-modal-close="false"`:

```erb
<%= form_with model: [note.parent, note],
      data: { turbo_frame: "notes", turbo_modal_close: "false" } do |f| %>
```

Both `beforeFetchResponse` and `submitEnd` check for that attribute before closing.

## A complete example

Let's wire up a `Widget` resource with a name and description. The index page has a "New Widget" button that opens a creation form in a modal.

### Routes

```ruby
# config/routes.rb
resources :widgets, only: [:index, :new, :create]
```

### Controller

Look closely: there's nothing modal-specific here. This is the controller you'd write anyway.

```ruby
# app/controllers/widgets_controller.rb
class WidgetsController < ApplicationController
  def index
    @widgets = Widget.order(:name)
  end

  def new
    @widget = Widget.new
  end

  def create
    @widget = Widget.new(widget_params)

    if @widget.save
      redirect_to widgets_path, notice: "Widget created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def widget_params
    params.require(:widget).permit(:name, :description)
  end
end
```

### The trigger

The only thing that makes this a modal link is `data: { turbo_frame: "modal" }`:

```erb
<%# app/views/widgets/index.html.erb %>
<div class="d-flex justify-content-between align-items-center mb-4">
  <h1 class="h3 mb-0">Widgets</h1>
  <%= link_to new_widget_path,
        class: "btn btn-primary",
        data: { turbo_frame: "modal" } do %>
    <i class="bi bi-plus-lg me-2"></i> New Widget
  <% end %>
</div>

<ul id="widgets" class="list-group">
  <% @widgets.each do |widget| %>
    <li class="list-group-item"><%= widget.name %></li>
  <% end %>
</ul>
```

### The `new` view

Wrap the form in the component. The `title:` becomes the modal header:

```erb
<%# app/views/widgets/new.html.erb %>
<%= render ModalComponent.new(title: "New Widget") do %>
  <p class="text-muted mb-4">Add a widget to the catalogue.</p>
  <%= render "form", widget: @widget %>
<% end %>
```

### The form partial

A completely plain `form_with`. The Cancel button uses Bootstrap's `data-bs-dismiss`, which feeds into the same cleanup path as the close button:

```erb
<%# app/views/widgets/_form.html.erb %>
<%= form_with model: widget do |f| %>
  <% if widget.errors.any? %>
    <div class="alert alert-danger mb-4">
      <%= widget.errors.full_messages.to_sentence %>
    </div>
  <% end %>

  <div class="mb-3">
    <%= f.label :name, class: "form-label" %>
    <%= f.text_field :name, class: "form-control", autofocus: true %>
  </div>

  <div class="mb-3">
    <%= f.label :description, class: "form-label" %>
    <%= f.text_area :description, class: "form-control", rows: 3 %>
  </div>

  <div class="d-flex justify-content-end gap-2">
    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
      Cancel
    </button>
    <%= f.submit "Create Widget", class: "btn btn-primary" %>
  </div>
<% end %>
```

### The flow

1. Click **New Widget**. The form appears in the modal.
2. Submit with a blank name. The modal re-renders with the error.
3. Submit with a valid name. The controller redirects to the index, the modal closes, and the page shows the flash message and the new widget.

Adding an `edit` modal later is the same three steps: a link with `turbo_frame: "modal"`, an `edit` view wrapped in `ModalComponent`, and a standard `update` action.

## Gotchas

A few things that have bitten me, so they don't bite you:

- **Exactly one frame per page.** The layout must render exactly one empty `turbo_frame_tag "modal"`. If a page omits it (a different layout, say), Turbo logs a missing-frame error and the modal never opens.
- **Two things are both called `modal`, on purpose.** The frame id is the Turbo target, and the inner div id is the Bootstrap target. Keep both.
- **The redirect listener is global while a modal is open.** `turbo:before-fetch-response` is bound on `document`, so *any* redirected fetch becomes a full visit while the modal is showing. The static backdrop stops users clicking elsewhere on the page, but a frame-targeted link *inside* the modal whose action redirects will also trigger it. For in-modal navigation, prefer rendering a 200 over redirecting.
- **Never call `hide()` from a Turbo Stream path.** Replace the frame instead and let `disconnect()` clean up. Calling `dispose()` without the body cleanup leaves `modal-open` on `<body>` and locks page scrolling, which is a confusing bug to track down.
- **ESC closes, clicking the backdrop doesn't.** That's intentional. A static backdrop stops users from losing a half-filled form to a stray click, while ESC remains a deliberate way out.

## Wrapping up

What I like most about this pattern is how little of it there is. One empty frame, one component, one Stimulus controller, and after that every modal in the app is just a normal Rails view with a `render ModalComponent.new(...)` around it. Controllers stay standard, validation errors take care of themselves, and when something about modal behaviour needs to change, there's exactly one file to change it in.

If you're on Hotwire and still writing per-modal JavaScript, give it a try. It's a small amount of setup that pays for itself on the second modal.
{% endraw %}
