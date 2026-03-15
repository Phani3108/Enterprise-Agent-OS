#!/usr/bin/env python3
"""Take screenshots of all AgentOS dashboard screens."""

import os
import time
import json
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3010"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "screenshots")

SCREENS = [
    # (sidebar-section,         filename,                           sidebar-label)
    # Home
    ("home",                    "01-home-command-center",            "Home"),
    # C-Suite
    ("csuite-command",          "02-csuite-command-center",          "Command Center"),
    ("csuite-vision",           "03-vision-dashboard",               "Vision & Strategy"),
    # Workspaces
    ("ws-marketing",            "04-marketing-hub",                  "Marketing"),
    ("ws-engineering",          "05-engineering-hub",                 "Engineering"),
    ("ws-product",              "06-product-hub",                    "Product"),
    ("ws-hr",                   "07-hr-hub",                         "HR & Talent"),
    # Platform
    ("platform-agents",         "08-agents-panel",                   "Agents"),
    ("platform-courses",        "09-ai-courses-hub",                 "Courses"),
    ("platform-innovation",     "10-innovation-labs",                "Innovation Labs"),
    ("platform-budget",         "11-budget-intelligence",            "Budget Intelligence"),
    ("platform-improvement",    "12-agent-improvement",              "Agent Improvement"),
    # Operations
    ("ops-integrations",        "13-tools-registry",                 "Tool Registry"),
    ("ops-notifications",       "14-notification-center",            "Notifications"),
    ("ops-executions",          "15-executions",                     "Executions"),
    ("ops-discussions",         "16-discussion-forum",               "Discussions"),
    ("ops-blog",                "17-blog-editor",                    "Blog"),
    # Admin
    ("admin-governance",        "18-governance",                     "Governance"),
    ("admin-usage",             "19-usage-analytics",                "Usage & Analytics"),
    ("admin-settings",          "20-settings",                       "Settings"),
]

os.makedirs(OUT_DIR, exist_ok=True)

NAVIGATE_JS = """
(sectionId) => {
    // Use the Zustand store directly via window to navigate
    const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    // First try: find sidebar item whose data-section or text matches
    for (const btn of buttons) {
        const text = btn.textContent.trim();
        const section = btn.getAttribute('data-section');
        if (section === sectionId) { btn.click(); return 'data-section:' + text; }
    }
    // Second try: match by label text
    for (const btn of buttons) {
        const text = btn.textContent.trim();
        if (text === sectionId) { btn.click(); return 'text:' + text; }
    }
    // Third try: use URL navigation
    window.history.pushState(null, '', '/' + sectionId);
    window.dispatchEvent(new PopStateEvent('popstate'));
    return 'url:' + sectionId;
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

        for section, filename, label in SCREENS:
            # Dismiss any modal before each click
            page.evaluate(DISMISS_MODAL_JS)

            print(f"  Navigating to '{label}' ({section}) -> {filename}.png", end="", flush=True)

            # Navigate using URL-based routing (most reliable)
            page.goto(f"{BASE_URL}/{section}", wait_until="networkidle", timeout=15000)
            time.sleep(2.5)

            # Dismiss any modal that may have appeared
            page.evaluate(DISMISS_MODAL_JS)
            time.sleep(0.5)

            out_path = os.path.join(OUT_DIR, f"{filename}.png")
            page.screenshot(path=out_path, full_page=False)
            print(f"    Saved -> {filename}.png")

        browser.close()
        print(f"\nDone! {len(SCREENS)} screenshots saved to {OUT_DIR}")

if __name__ == "__main__":
    take_screenshots()
