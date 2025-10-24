<script setup lang="ts"></script>

<template>
  <div class="max-w-3xl space-y-12 pb-[36rem]">
    <section id="what-is-autorize">
      <h2 class="text-2xl font-semibold mb-4">What is Autorize?</h2>
      <p class="text-surface-300 leading-relaxed mb-4">
        Autorize is a plugin for Caido that helps you find authorization
        vulnerabilities in web applications. It works by automatically testing
        if lower-privilege users can access resources they should not have
        access to.
      </p>
      <p class="text-surface-300 leading-relaxed">
        Think of it this way: when you browse a web app as an admin, Autorize
        automatically checks if a regular user or someone without login
        credentials can access the same resources. This helps you find security
        issues where access controls are not properly enforced.
      </p>
    </section>

    <section id="how-it-works">
      <h2 class="text-2xl font-semibold mb-4">How It Works</h2>
      <p class="text-surface-300 leading-relaxed mb-6">
        For every request you send through Caido, Autorize creates and tests up
        to three different versions:
      </p>

      <div class="space-y-6">
        <div class="border border-surface-700 rounded p-4">
          <h3 class="text-lg font-semibold mb-2 text-green-400">
            Baseline Request
          </h3>
          <p class="text-surface-300 leading-relaxed">
            This is your original request, sent as-is. It represents what a
            high-privilege user (like an admin) can access. Autorize uses this
            as a reference to compare against the other tests.
          </p>
        </div>

        <div class="border border-surface-700 rounded p-4">
          <h3 class="text-lg font-semibold mb-2 text-blue-400">
            Mutated Request
          </h3>
          <p class="text-surface-300 leading-relaxed">
            This request is modified to include credentials of a lower-privilege
            user. For example, you might replace the admin's authentication
            token with a regular user's token. This tests if the regular user
            can access admin resources.
          </p>
        </div>

        <div class="border border-surface-700 rounded p-4">
          <h3 class="text-lg font-semibold mb-2 text-orange-400">
            No-Auth Request
          </h3>
          <p class="text-surface-300 leading-relaxed">
            This request has all authentication headers removed. It tests if
            someone without any login credentials can access protected
            resources. Autorize automatically removes common auth headers like
            <code class="px-1.5 py-0.5 bg-surface-800 rounded text-xs"
              >Authorization</code
            >
            and
            <code class="px-1.5 py-0.5 bg-surface-800 rounded text-xs"
              >Cookie</code
            >.
          </p>
        </div>
      </div>

      <div class="mt-6 bg-surface-800 border border-surface-700 rounded p-4">
        <p class="text-surface-300 text-sm">
          <i class="fas fa-info-circle text-blue-400 mr-2"></i>
          All three request types can be customized using the mutations system,
          which we'll cover later.
        </p>
      </div>
    </section>

    <section id="request-sources">
      <h2 class="text-2xl font-semibold mb-4">Sending Requests to Autorize</h2>
      <p class="text-surface-300 leading-relaxed mb-6">
        There are two ways to send requests to Autorize for testing:
      </p>

      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-semibold mb-3">1. Enable Passive Scanning</h3>
          <p class="text-surface-300 leading-relaxed mb-3">
            Go to the Configuration page and toggle the plugin to enabled. Once
            enabled, Autorize will automatically test every request that goes
            through Caido's proxy.
          </p>
          <p class="text-surface-300 leading-relaxed">
            This is the recommended approach as it captures all your traffic
            automatically.
          </p>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-3">
            2. Manual Selection from HTTP History
          </h3>
          <p class="text-surface-300 leading-relaxed mb-3">
            You can also manually send specific requests to Autorize:
          </p>
          <ol class="list-decimal list-inside space-y-2 text-surface-300 ml-4">
            <li>Open the HTTP History page in Caido</li>
            <li>Right-click on any request</li>
            <li>Select <span class="font-medium">Plugins → Autorize</span></li>
            <li>Click on "Send Request to Autorize"</li>
          </ol>
          <p class="text-surface-300 leading-relaxed mt-3">
            This gives you precise control over which requests to test.
          </p>
        </div>
      </div>
    </section>

    <section id="access-states">
      <h2 class="text-2xl font-semibold mb-4">Understanding Access States</h2>
      <p class="text-surface-300 leading-relaxed mb-6">
        After testing each request, Autorize assigns an access state that tells
        you whether the request succeeded or failed. These states help you
        quickly identify authorization vulnerabilities.
      </p>

      <div class="space-y-4">
        <div class="border border-surface-700 rounded p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="px-3 py-1 bg-green-600 rounded text-sm font-medium">
              ALLOW
            </div>
            <h3 class="text-lg font-semibold">Authorized</h3>
          </div>
          <p class="text-surface-300 leading-relaxed">
            The server accepted the request and returned a successful response.
            This might indicate an authorization vulnerability if a
            low-privilege user was able to access protected resources.
          </p>
        </div>

        <div class="border border-surface-700 rounded p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="px-3 py-1 bg-red-600 rounded text-sm font-medium">
              DENY
            </div>
            <h3 class="text-lg font-semibold">Unauthorized</h3>
          </div>
          <p class="text-surface-300 leading-relaxed">
            The server denied the request, usually with status codes like 401,
            403, or 404. This means access controls are working as expected.
          </p>
        </div>

        <div class="border border-surface-700 rounded p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="px-3 py-1 bg-amber-600 rounded text-sm font-medium">
              UNCERTAIN
            </div>
            <h3 class="text-lg font-semibold">Uncertain</h3>
          </div>
          <p class="text-surface-300 leading-relaxed">
            Autorize could not determine if the request was allowed or denied.
            This happens when the response is different from the baseline but
            does not show clear denial indicators. You should manually review
            these cases.
          </p>
        </div>
      </div>

      <div class="mt-6 bg-surface-800 border border-surface-700 rounded p-4">
        <p class="text-surface-300 text-sm">
          <i class="fas fa-cog text-blue-400 mr-2"></i>
          You can customize these labels in the UI Settings. For example, you
          might prefer "ENFORCED" and "BYPASSED" instead of "DENY" and "ALLOW".
        </p>
      </div>
    </section>

    <section id="mutations">
      <h2 class="text-2xl font-semibold mb-4">Mutations System</h2>
      <p class="text-surface-300 leading-relaxed mb-6">
        Mutations allow you to modify requests before they are sent. This is how
        you configure Autorize to test with different user credentials or remove
        specific headers.
      </p>

      <h3 class="text-lg font-semibold mb-3">
        What Can You Do with Mutations?
      </h3>
      <div class="space-y-4 mb-6">
        <div class="border-l-4 border-blue-500 pl-4">
          <h4 class="font-semibold mb-1">Replace Header</h4>
          <p class="text-surface-300 text-sm">
            Replace an existing header value or add it if it does not exist.
            Perfect for swapping authentication or CSRF tokens.
          </p>
        </div>
        <div class="border-l-4 border-blue-500 pl-4">
          <h4 class="font-semibold mb-1">Add Header</h4>
          <p class="text-surface-300 text-sm">
            Add a new header to the request. Useful for adding custom headers
            required by the application. If header with the same name already
            exists, it's still going to add a new one.
          </p>
        </div>
        <div class="border-l-4 border-blue-500 pl-4">
          <h4 class="font-semibold mb-1">Remove Header</h4>
          <p class="text-surface-300 text-sm">
            Remove a specific header from the request. Use this to strip out
            headers that should not be included.
          </p>
        </div>
        <div class="border-l-4 border-blue-500 pl-4">
          <h4 class="font-semibold mb-1">Match and Replace</h4>
          <p class="text-surface-300 text-sm">
            Find any text in the request and replace it with different text.
            This works on the entire raw request, not just headers. Supports
            &#123;&#123; VAR_NAME &#125;&#125; for Caido environment variables.
          </p>
        </div>
      </div>

      <h3 class="text-lg font-semibold mb-3">Common Use Cases</h3>
      <div class="space-y-4">
        <div class="bg-surface-800 rounded py-2">
          <h4 class="font-semibold mb-2">Testing with Different User Roles</h4>
          <p class="text-surface-300 text-sm mb-3">
            Create a mutation for the mutated request type that replaces the
            Authorization header with a regular user's token:
          </p>
          <div class="bg-surface-900 rounded p-3 font-mono text-xs">
            <div class="text-surface-400">Type: Replace Header</div>
            <div class="text-surface-400">
              Header: <span class="text-white">Authorization</span>
            </div>
            <div class="text-surface-400">
              Value:
              <span class="text-white">Bearer regular-user-token-here</span>
            </div>
          </div>
        </div>

        <div class="bg-surface-800 rounded py-2">
          <h4 class="font-semibold mb-2">Using Environment Variables</h4>
          <p class="text-surface-300 text-sm mb-3">
            Store tokens in Caido's environment variables and reference them
            using
            <code class="px-1.5 py-0.5 bg-surface-900 rounded text-xs"
              >&#123;&#123; VAR_NAME &#125;&#125;</code
            >
            syntax:
          </p>
          <div class="bg-surface-900 rounded p-3 font-mono text-xs">
            <div class="text-surface-400">
              Value:
              <span class="text-white"
                >Bearer &#123;&#123; LOW_PRIV_TOKEN &#125;&#125;</span
              >
            </div>
          </div>
          <p class="text-surface-300 text-sm mt-3">
            This makes it easy to update tokens without modifying all your
            mutations.
          </p>
        </div>

        <div class="bg-surface-800 rounded py-2">
          <h4 class="font-semibold mb-2">Customizing No-Auth Requests</h4>
          <p class="text-surface-300 text-sm">
            While Autorize removes common auth headers automatically, you might
            need to remove application-specific headers. Add mutations for the
            no-auth type to handle these cases.
          </p>
        </div>
      </div>
    </section>

    <section id="filtering">
      <h2 class="text-2xl font-semibold mb-4">Filtering Requests</h2>
      <p class="text-surface-300 leading-relaxed mb-6">
        Filtering is important to avoid testing unnecessary requests. Without
        proper filtering, you might waste resources testing static files,
        analytics, or unrelated endpoints.
      </p>

      <div class="bg-amber-900/20 border border-amber-800 rounded p-4 mb-6">
        <p class="text-amber-200 text-sm">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          <strong>Recommendation:</strong> Always configure filtering before
          enabling passive scanning. This prevents your queue from being flooded
          with irrelevant requests. Lots of requests might cause performance
          issues.
        </p>
      </div>

      <h3 class="text-lg font-semibold mb-3">Available Filtering Options</h3>
      <div class="space-y-4">
        <div class="border border-surface-700 rounded p-4">
          <h4 class="font-semibold mb-2">Only In Scope</h4>
          <p class="text-surface-300 text-sm mb-2">
            When enabled, Autorize only processes requests that match your
            defined scope in Caido. This is useful when working on a specific
            target application.
          </p>
        </div>

        <div class="border border-surface-700 rounded p-4">
          <h4 class="font-semibold mb-2">Filter Presets</h4>
          <p class="text-surface-300 text-sm mb-2">
            Select one or more filter presets you have configured in Caido.
            Requests must match all selected filters to be processed.
          </p>
        </div>

        <div class="border border-surface-700 rounded p-4">
          <h4 class="font-semibold mb-2">HTTPQL Query</h4>
          <p class="text-surface-300 text-sm mb-3">
            Write a custom HTTPQL query to filter requests based on any
            criteria. This is the most powerful filtering option.
          </p>
          <p class="text-surface-300 text-sm font-semibold mb-2">
            Example: Filter API requests only
          </p>
          <div class="bg-surface-900 rounded p-3 font-mono text-xs mb-3">
            req.path.like:"/api/%"
          </div>
        </div>
      </div>

      <div class="mt-6 bg-surface-800 border border-surface-700 rounded p-4">
        <p class="text-surface-300 text-sm">
          <i class="fas fa-info-circle text-blue-400 mr-2"></i>
          Autorize automatically skips common static files (images, CSS, JS) and
          analytics endpoints. You don't need to filter these manually.
        </p>
      </div>
    </section>

    <section id="detection">
      <h2 class="text-2xl font-semibold mb-4">Custom Detection Rules</h2>
      <p class="text-surface-300 leading-relaxed mb-6">
        By default, Autorize uses smart logic to determine if a request was
        authorized or denied. However, some applications have unique response
        patterns. Custom detection rules let you define exactly when a response
        should be marked as ALLOW or DENY.
      </p>

      <h3 class="text-lg font-semibold mb-3">How It Works</h3>
      <p class="text-surface-300 leading-relaxed mb-6">
        You can write HTTPQL queries that match specific response
        characteristics. When a response matches your query, Autorize will use
        your rule instead of the default logic.
      </p>

      <div class="space-y-4">
        <div class="border border-surface-700 rounded p-4">
          <h4 class="font-semibold mb-3">Unauthorized Response Detection</h4>
          <p class="text-surface-300 text-sm mb-3">
            Define when a response indicates access was denied. This takes
            priority over the authorized detection.
          </p>
          <p class="text-surface-300 text-sm font-semibold mb-2">
            Example: Mark 404 responses as denied
          </p>
          <div class="bg-surface-900 rounded p-3 font-mono text-xs mb-3">
            resp.code.eq:404
          </div>
          <p class="text-surface-300 text-sm font-semibold mb-2">
            Example: Check for error messages in response
          </p>
          <div class="bg-surface-900 rounded p-3 font-mono text-xs">
            resp.raw.cont:"Access Denied"
          </div>
        </div>

        <div class="border border-surface-700 rounded p-4">
          <h4 class="font-semibold mb-3">Authorized Response Detection</h4>
          <p class="text-surface-300 text-sm mb-3">
            Define when a response indicates access was granted.
          </p>
          <p class="text-surface-300 text-sm font-semibold mb-2">
            Example: Successful API responses
          </p>
          <div class="bg-surface-900 rounded p-3 font-mono text-xs mb-3">
            resp.code.eq:200 AND resp.raw.cont:"success"
          </div>
          <p class="text-surface-300 text-sm font-semibold mb-2">
            Example: Check for authentication confirmation
          </p>
          <div class="bg-surface-900 rounded p-3 font-mono text-xs">
            resp.raw.cont:"authenticated"
          </div>
        </div>
      </div>
    </section>

    <section id="queue-settings">
      <h2 class="text-2xl font-semibold mb-4">Queue Settings</h2>
      <p class="text-surface-300 leading-relaxed mb-6">
        Queue settings control how Autorize sends requests to your target
        application. Proper configuration helps you avoid overwhelming the
        server or triggering rate limits.
      </p>

      <div class="space-y-4">
        <div class="border border-surface-700 rounded p-4">
          <h4 class="font-semibold mb-2">Max Concurrent Requests (1-10)</h4>
          <p class="text-surface-300 text-sm">
            The maximum number of requests that can be sent at the same time.
            Lower values are safer but slower. Higher values test faster but
            might cause issues and inconsistencies with the target server.
          </p>
          <p class="text-surface-300 text-sm mt-2">
            <strong>Default:</strong> 2 concurrent requests
          </p>
        </div>

        <div class="border border-surface-700 rounded p-4">
          <h4 class="font-semibold mb-2">Requests Per Second (1-100)</h4>
          <p class="text-surface-300 text-sm">
            The maximum number of requests Autorize will send per second. This
            prevents you from overwhelming the target server or triggering rate
            limiting protections.
          </p>
          <p class="text-surface-300 text-sm mt-2">
            <strong>Default:</strong> 6 requests per second
          </p>
        </div>

        <div class="border border-surface-700 rounded p-4">
          <h4 class="font-semibold mb-2">Request Timeout (5-300 seconds)</h4>
          <p class="text-surface-300 text-sm">
            How long to wait for a response before considering the request
            failed. Increase this for slow servers or complex endpoints.
          </p>
          <p class="text-surface-300 text-sm mt-2">
            <strong>Default:</strong> 30 seconds
          </p>
        </div>
      </div>

      <div class="mt-6 bg-amber-900/20 border border-amber-800 rounded p-4">
        <p class="text-amber-200 text-sm">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          <strong>Note:</strong> Queue settings can only be changed when passive
          scanning is disabled. Stop the plugin before adjusting these values.
        </p>
      </div>
    </section>

    <section id="general-settings">
      <h2 class="text-2xl font-semibold mb-4">General Settings</h2>

      <div class="space-y-4">
        <div class="border border-surface-700 rounded p-4">
          <h4 class="font-semibold mb-2">Test No Auth</h4>
          <p class="text-surface-300 text-sm mb-3">
            When enabled, Autorize will send a third request with all
            authentication removed. Disable this if you only want to test
            authorization between different user roles, not unauthenticated
            access.
          </p>
          <p class="text-surface-300 text-sm">
            <strong>Default:</strong> Enabled
          </p>
        </div>
      </div>
    </section>

    <section id="ui-settings">
      <h2 class="text-2xl font-semibold mb-4">UI Settings</h2>
      <p class="text-surface-300 leading-relaxed mb-6">
        Customize how information is displayed in the results table to match
        your preferences.
      </p>

      <div class="space-y-4">
        <div class="border border-surface-700 rounded p-4">
          <h4 class="font-semibold mb-2">Show Only Lengths</h4>
          <p class="text-surface-300 text-sm">
            Hide response status codes and only show response lengths. This
            creates a more compact view when you primarily care about response
            size differences.
          </p>
        </div>

        <div class="border border-surface-700 rounded p-4">
          <h4 class="font-semibold mb-2">Show Full URL</h4>
          <p class="text-surface-300 text-sm">
            Display the complete URL including the host. When disabled, only the
            path is shown. Enable this when working with multiple domains.
          </p>
        </div>

        <div class="border border-surface-700 rounded p-4">
          <h4 class="font-semibold mb-2">Access State Labels</h4>
          <p class="text-surface-300 text-sm mb-3">
            Customize the labels shown for each access state. You can use up to
            14 characters per label.
          </p>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-3">
              <div
                class="px-2 py-1 bg-green-600 rounded text-xs font-medium w-24 text-center"
              >
                ALLOW
              </div>
              <span class="text-surface-300"
                >Default for authorized access</span
              >
            </div>
            <div class="flex items-center gap-3">
              <div
                class="px-2 py-1 bg-red-600 rounded text-xs font-medium w-24 text-center"
              >
                DENY
              </div>
              <span class="text-surface-300"
                >Default for unauthorized access</span
              >
            </div>
            <div class="flex items-center gap-3">
              <div
                class="px-2 py-1 bg-amber-600 rounded text-xs font-medium w-24 text-center"
              >
                UNCERTAIN
              </div>
              <span class="text-surface-300">Default for uncertain cases</span>
            </div>
          </div>
          <p class="text-surface-300 text-sm mt-3">
            Popular alternatives are "ENFORCED" and "BYPASSED"
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
