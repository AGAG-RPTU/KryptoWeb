# jekyll-terser minifies every .js file whose name does not end in .min.js,
# including the third-party libraries downloaded to assets/libs/. Their script
# tags carry the Subresource Integrity hash of the original file, so browsers
# block a minified copy. Running after jekyll-terser, this generator ships
# those files unchanged. bin/check-sri checks the result.
module KryptoWeb
  class KeepLibrariesUnminified < Jekyll::Generator
    priority :lowest

    LIBRARIES = File.join("assets", "libs", "")

    def generate(site)
      return unless defined?(Jekyll::Terser::JSFile)

      libraries = File.join(site.source, LIBRARIES)
      site.static_files.map! do |file|
        next file unless file.is_a?(Jekyll::Terser::JSFile) && file.path.start_with?(libraries)

        dir = File.dirname(file.path).delete_prefix(site.source)
        Jekyll::StaticFile.new(site, site.source, dir, file.name)
      end
    end
  end
end
