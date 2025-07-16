.PHONY: test lint

test:
	pytest -q || test $$? -eq 5

lint:
	ruff check .
