# Local build/preview for this GitHub Pages (Jekyll) site.
#
# We pin the `github-pages` gem so a local `bundle exec jekyll serve`
# uses the SAME Jekyll version and plugin set that GitHub Pages runs
# server-side — what you see locally is what deploys.
#
# First-time setup (after Ruby is installed):
#   cd components/ken-site
#   bundle install
#   bundle exec jekyll serve --livereload
# then open http://127.0.0.1:4000/ken-site/
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins

# Windows + JRuby don't ship tzinfo data; these provide it.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Ruby 3.4+ no longer bundles these as default gems.
gem "csv"
gem "logger"
gem "base64"
gem "bigdecimal"
