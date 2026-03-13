import pkgutil
import importlib
import sys
import os

# Add current directory to sys.path to allow imports from local packages
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fetchers.base import WordProvider

def download_words():
    print("Starting word list generation...")
    
    # Import the fetchers package
    try:
        import fetchers
    except ImportError as e:
        print(f"Error: Could not import 'fetchers' package: {e}")
        return

    # Discover and run all providers
    provider_count = 0
    for loader, module_name, is_pkg in pkgutil.iter_modules(fetchers.__path__):
        if module_name == 'base':
            continue
            
        full_module_name = f'fetchers.{module_name}'
        try:
            module = importlib.import_module(full_module_name)
            
            # Look for classes that inherit from WordProvider
            for attribute_name in dir(module):
                attribute = getattr(module, attribute_name)
                
                if (isinstance(attribute, type) and 
                    issubclass(attribute, WordProvider) and 
                    attribute is not WordProvider):
                    
                    print(f"Running provider: {attribute_name} (from {module_name})")
                    provider = attribute()
                    provider.run()
                    provider_count += 1
                    
        except Exception as e:
            print(f"Error loading or running fetcher {full_module_name}: {e}")

    if provider_count == 0:
        print("No word providers found in 'fetchers' directory.")
    else:
        print(f"Completed word list generation using {provider_count} providers.")

if __name__ == "__main__":
    download_words()
