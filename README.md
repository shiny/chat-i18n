# chat-i18n
chat-i18n is a js cli command to translate locale messages from one language to another.

## Qucik Start
1. put `chat-i18n.toml` file in your project root directory.
2. edit and save your source locale messages file, do not commit it to git.
3. run `bunx chat-i18n` command in your terminal to translate.

## Limitations
- Only support json format locale messages.
- Only support git as source and destination.

Directory structure: `any_locale_messages_dir/{locale}.json`

## Configuration Example

```toml
# the locale message directory in your project
dir = "locales"
source = "en"

[provider]
# The name of the provider you are using. Currently, only "deekseek" is supported.
name = "deekseek"

[deekseek]
# Your Deekseeker API key
api_key = "sk-**"
```

## License
MIT
