#!/usr/bin/env python3
"""Take screenshots of all AgentOS dashboard screens."""

import os
import time
import json
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3010"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "screenshots")

SCREENS = [
    ("home",         "01-home-command-center",  "Command Center"),
    ("personas",     "02-personas",             "Personas"),
    ("marketplace",  "03-skill-marketplace",    "Marketplace"),
    ("builder",      "04-skill-builder",        "Skill Builder"),
    ("agents",       "05-agents",               "Agents"),
    ("workflows",    "06-workflows",            "Workflows"),
    ("tools",        "07-tools-registry",       "Tools"),
    ("prompts",      "08-prompt-library",       "Prompt Library"),
    ("knowledge",    "09-knowledge-explorer",   "Knowledge"),
    ("control",      "10-control-plane",        "Control Plane"),
    ("memory",       "11-memory-graph",         "Memory Graph"),
    ("acp",          "12-agent-collaboration",  "Agent Collab"),
    ("governance",   "13-governance",           "Governance"),
    ("observability","14-observability",        "Observability"),
    ("learning",     "15-learning-hub",         "Learning"),
    ("scheduler",    "16-scheduler",            "Scheduler"),
    ("settings",     "17-settings",             "Settings"),
]

os.makedirs(OUT_DIR, exist_ok=True)

CLICK_JS = """
(label) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find(b => b.textContent.includes(label));
    if (target) { target.click(); return target.textContent.trim(); }
    return null;
}
"""

DISMISS_MODAL_JS = """
() => {
    // Click "Skip" button in onboarding modal
    const buttons = Array.from(document.querySelectorAll('button'));
    const skip = buttons.find(b => b.textContent.includes("Skip") || b.textContent.includes("explore"));
    if (skip) { skip.click(); return 'dismissed'; }
    // Also click any ✕ close buttons on overlays
    const close = buttons.find(b => b.textContent.trim() === '✕' || b.textContent.trim() === '×');
    if (close) { close.click(); return 'closed'; }
    return 'none';
}
"""

def take_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
        )
        page = context.new_page()

        print(f"Loading {BASE_URL} ...")
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        time.sleep(3)

        # Dismiss onboarding modal if present
        modal_result = page.evaluate(DISMISS_MODAL_JS)
        if modal_result != 'none':
            print(f"  Modal dismissed ({modal_result})")
            time.sleep(0.8)

        for _section, filename, label in SCREENS:
            # Dismiss any modal before each click
            page.evaluate(DISMISS_MODAL_JS)

            print(f"  Navigating to '{label}' -> {filename}.png", end="", flush=True)
            clicked = page.evaluate(CLICK_JS, label)
            if clicked:
                print(f" [clicked: {clicked[:30]}]")
            else:
                print(f" [WARNING: not found]")

            time.sleep(1.8)

            # Dismiss any modal that may have appeared
            page.evaluate(DISMISS_MODAL_JS)
            time.sleep(0.3)

            out_path = os.path.join(OUT_DIR, f"{filename}.png")
            page.screenshot(path=out_path, full_page=False)
            print(f"    Saved -> {filename}.png")

        browser.close()
        print(f"\nDone! {len(SCREENS)} screenshots saved to {OUT_DIR}")

if __name__ == "__main__":
    take_screenshots()
