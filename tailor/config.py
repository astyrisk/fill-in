"""
Configuration module for the tailor service.
This module loads configuration from a JSON file or environment variables.
"""
import os
import json

# Default configuration
DEFAULT_CONFIG = {
    # "openrouter_api_key": "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",
    "openrouter_api_key": "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",
    "openrouter_api_url": "https://openrouter.ai/api/v1/chat/completions",
    "model": "deepseek/deepseek-chat-v3-0324:free",
    "custom_prompt": ""  # Empty string means use the default prompt in tailor.py
}

# Path to the configuration file
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

def load_config():
    """
    Load configuration from the config file if it exists,
    otherwise use the default configuration.
    """
    config = DEFAULT_CONFIG.copy()

    # Try to load from config file
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                file_config = json.load(f)
                config.update(file_config)
        except Exception as e:
            print(f"Error loading config file: {e}")

    # Override with environment variables if they exist
    if os.environ.get('OPENROUTER_API_KEY'):
        config['openrouter_api_key'] = os.environ.get('OPENROUTER_API_KEY')

    return config

def save_config(config):
    """
    Save the configuration to the config file.
    """
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving config file: {e}")
        return False

# Export the configuration
config = load_config()
