#!/usr/bin/env python3
"""
Record AgentOS demo videos + screenshots for README.

Produces:
  1. demos/agentos-demo.mp4         — 2-min full platform walkthrough
  2. demos/agentos-guided-tour-demo.mp4 — Guided tour flow
  3. docs/screenshots/*.png         — 23 screenshots for README

Requires: playwright, ffmpeg
Ensure gateway (port 3000) and web (port 3010) are running before starting.
"""

import os
import sys
import time
import subprocess
from pathlib import Path

BASE_URL = "http://localhost:3010"
OUT_DIR  = Path(__file__).resolve().parent.parent / "demos"
SS_DIR   = Path(__file__).resolve().parent.parent / "docs" / "screenshots"
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(SS_DIR, exist_ok=True)

DISMISS_MODAL_JS = """
() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const skip = buttons.find(b => b.textContent.includes("Skip") || b.textContent.includes("explore"));
    if (skip) { skip.click(); return 'dismissed'; }
    const close = buttons.find(b => b.textContent.trim() === '✕' || b.textContent.trim() === '×');
    if (close) { close.click(); return 'closed'; }
    return 'none';
}
"""

# Sidebar section IDs (from Sidebar.tsx data-tour="sidebar-{id}")
SIDEBAR_IDS = {
    "Command Center": "home",
    "Personas": "personas",
    "Marketplace": "marketplace",
    "Agents": "agents",
    "Workflows": "workflows",
    "Observability": "observability",
    "Governance": "governance",
    "Marketing": "marketing",
    "Engineering": "engineering",
    "Product": "product",
    "Settings": "settings",
}

CLICK_SIDEBAR_BY_ID_JS = """
(sectionId) => {
    const el = document.querySelector('[data-tour="sidebar-' + sectionId + '"]');
    if (el) { el.click(); return true; }
    return false;
}
"""

CLICK_MARKETING_NAV_JS = """
(label) => {
    const module = document.querySelector('[data-tour="marketing-module"]');
    if (!module) return null;
    const buttons = Array.from(module.querySelectorAll('button'));
    const target = buttons.find(b => b.textContent && b.textContent.trim().includes(label));
    if (target) { target.click(); return target.textContent.trim(); }
    return null;
}
"""


def take_screenshots():
    """Capture all 23 app screens as PNGs for the README."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        print("Taking screenshots …")
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.evaluate(DISMISS_MODAL_JS)
        time.sleep(1)

        def ss(name):
            page.screenshot(path=str(SS_DIR / name))
            print(f"  📸 {name}")

        def nav(sid, dwell=1.2):
            page.evaluate(CLICK_SIDEBAR_BY_ID_JS, sid)
            time.sleep(dwell)

        ss("01-home-command-center.png")
        nav("personas");     ss("02-personas.png")
        nav("marketplace");  ss("03-skill-marketplace.png")
        nav("builder");      ss("04-skill-builder.png")
        nav("agents");       ss("05-agents.png")
        nav("workflows");    ss("06-workflows.png")
        nav("tools");        ss("07-tools-registry.png")
        nav("prompts");      ss("08-prompt-library.png")
        nav("knowledge");    ss("09-knowledge-explorer.png")
        nav("control");      ss("10-control-plane.png")
        nav("memory");       ss("11-memory-graph.png")
        nav("acp");          ss("12-agent-collaboration.png")
        nav("governance");   ss("13-governance.png")
        nav("observability"); ss("14-observability.png")
        nav("learning");     ss("15-learning-hub.png")
        nav("scheduler");    ss("16-scheduler.png")
        nav("settings");     ss("17-settings.png")

        # Engineering Hub — command center + skill form
        nav("engineering", dwell=2.0)
        ss("18-engineering-hub.png")
        try:
            page.click(".grid button:first-child", timeout=4000)
            time.sleep(1.5)
            ss("19-engineering-skill-form.png")
            # Expand advanced
            try:
                page.click("text=Show advanced", timeout=2000)
                time.sleep(1)
                ss("19b-engineering-advanced-form.png")
            except Exception:
                pass
            page.click("text=Cancel", timeout=2000)
            time.sleep(0.5)
        except Exception:
            pass
        # Integrations
        try:
            page.evaluate("() => { const btns = [...document.querySelectorAll('button')]; const b = btns.find(b => b.textContent.trim() === 'Integrations'); if(b) b.click(); }")
            time.sleep(1)
            ss("20-engineering-integrations.png")
            page.evaluate("() => { const btns = [...document.querySelectorAll('button')]; const b = btns.find(b => b.textContent.includes('Command Center')); if(b) b.click(); }")
            time.sleep(0.5)
        except Exception:
            pass

        # Product Hub — command center + skill form
        nav("product", dwell=2.0)
        ss("21-product-hub.png")
        try:
            page.click(".grid button:first-child", timeout=4000)
            time.sleep(1.5)
            ss("22-product-skill-form.png")
            page.click("text=Cancel", timeout=2000)
            time.sleep(0.5)
        except Exception:
            pass

        # Marketing Hub
        nav("marketing", dwell=2.0)
        ss("23-marketing-hub.png")

        ctx.close()
        browser.close()

    print(f"\n✅ {len(list(SS_DIR.glob('*.png')))} screenshots saved → {SS_DIR}\n")


def convert_to_mp4(webm_path: Path, mp4_path: Path) -> bool:
    """Convert webm to mp4 using ffmpeg."""
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(webm_path), "-c:v", "libx264", "-preset", "fast", "-crf", "23", str(mp4_path)],
            check=True,
            capture_output=True,
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"  ffmpeg conversion failed: {e}")
        return False


def record_demo_video():
    """Record 2-minute full platform walkthrough: Home → Engineering → Product → Marketing → Platform."""
    from playwright.sync_api import sync_playwright

    video_dir = OUT_DIR / "raw_video"
    os.makedirs(video_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1440, "height": 900},
            record_video_dir=str(video_dir),
            record_video_size={"width": 1440, "height": 900},
        )
        page = ctx.new_page()
        print("Recording 2-min demo video …")
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        time.sleep(2)
        page.evaluate(DISMISS_MODAL_JS)
        time.sleep(1)

        def nav(sid, dwell=4):
            page.evaluate(CLICK_SIDEBAR_BY_ID_JS, sid)
            time.sleep(dwell)

        # (0:00–0:08) Home Command Center
        time.sleep(8)

        # (0:08–0:10) Personas quick look
        nav("personas", 6)

        # (0:14–0:42) Engineering Hub — 28s
        nav("engineering", 4)
        try:
            page.click(".grid button:first-child", timeout=4000)
            time.sleep(3)
            try:
                page.click("text=Show advanced", timeout=2000); time.sleep(2)
            except Exception: pass
            try:
                page.click("text=Sandbox", timeout=2000); time.sleep(2)
            except Exception: pass
            try:
                page.click("button[type='submit']", timeout=2000); time.sleep(10)
            except Exception: pass
        except Exception: pass
        nav("engineering", 3)  # back to skill grid

        # (0:42–1:08) Product Hub — 26s
        nav("product", 4)
        try:
            page.click(".grid button:first-child", timeout=4000)
            time.sleep(3)
            try:
                page.click("text=Show advanced", timeout=2000); time.sleep(3)
            except Exception: pass
            page.click("text=Cancel", timeout=2000); time.sleep(1)
        except Exception: pass
        nav("product", 3)

        # (1:08–1:26) Marketing Hub — 18s
        nav("marketing", 5)
        page.evaluate(CLICK_MARKETING_NAV_JS, "Command Center"); time.sleep(4)
        page.evaluate(CLICK_MARKETING_NAV_JS, "Integrations");   time.sleep(4)
        page.evaluate(CLICK_MARKETING_NAV_JS, "Analytics Hub");  time.sleep(4)

        # (1:26–2:00) Platform screens — 34s
        for sid, dwell in [("agents", 5), ("workflows", 5), ("control", 5), ("memory", 5), ("governance", 5), ("observability", 4)]:
            nav(sid, dwell)

        # End on home
        nav("home", 5)

        ctx.close()
        browser.close()

    # Find generated webm
    import shutil
    webms = sorted(video_dir.glob("*.webm"), key=lambda p: p.stat().st_mtime, reverse=True)
    if webms:
        raw = webms[0]
        mp4_path = OUT_DIR / "agentos-demo.mp4"
        print(f"  Converting to mp4 …")
        if convert_to_mp4(raw, mp4_path):
            shutil.rmtree(video_dir, ignore_errors=True)
            print(f"  ✅ {mp4_path}  ({mp4_path.stat().st_size / 1_048_576:.1f} MB)")
        else:
            print(f"  Raw webm saved: {raw}")
    else:
        print("  ⚠️  No webm found")


def record_screens_demo():
    """Record platform screens demo — Marketing section emphasized."""
    from playwright.sync_api import sync_playwright

    screens_video_dir = OUT_DIR / "screens_temp"
    os.makedirs(screens_video_dir, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
            record_video_dir=str(screens_video_dir),
            record_video_size={"width": 1440, "height": 900},
        )
        page = context.new_page()

        print("Recording screens demo...")
        print(f"  Loading {BASE_URL} ...")
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        time.sleep(2)

        page.evaluate(DISMISS_MODAL_JS)
        time.sleep(1.5)

        # Core screens — quick pass (4–5 sec each)
        core_screens = [
            ("Command Center", 5),
            ("Personas", 5),
            ("Marketplace", 5),
            ("Agents", 4),
            ("Workflows", 5),
        ]
        for label, dwell in core_screens:
            page.evaluate(DISMISS_MODAL_JS)
            sid = SIDEBAR_IDS.get(label)
            if sid:
                page.evaluate(CLICK_SIDEBAR_BY_ID_JS, sid)
            time.sleep(dwell)

        # Marketing — extensive coverage (executive focus, 60+ sec total)
        print("  Marketing section (extended)...")
        page.evaluate(CLICK_SIDEBAR_BY_ID_JS, "marketing")
        time.sleep(3)
        try:
            page.wait_for_selector('[data-tour="marketing-module"]', timeout=8000)
        except Exception:
            pass
        time.sleep(2)

        marketing_sections = [
            ("Command Center", 7),
            ("Campaigns", 6),
            ("Content Studio", 6),
            ("Creative Studio", 6),
            ("Research Hub", 5),
            ("Analytics Hub", 5),
            ("Campaign Pipeline", 7),
            ("Projects & Graph", 7),
            ("Community", 6),
            ("Integrations", 5),
            ("Execution Timeline", 5),
        ]
        for label, dwell in marketing_sections:
            page.evaluate(CLICK_MARKETING_NAV_JS, label)
            time.sleep(dwell)

        # Back to main nav — other key screens
        page.evaluate(CLICK_SIDEBAR_BY_ID_JS, "observability")
        time.sleep(5)
        page.evaluate(CLICK_SIDEBAR_BY_ID_JS, "governance")
        time.sleep(5)

        # End on Command Center for clean finish
        page.evaluate(CLICK_SIDEBAR_BY_ID_JS, "home")
        time.sleep(4)

        context.close()
        browser.close()

    # Playwright saves video when context closes
    video_files = list(screens_video_dir.glob("*.webm"))
    if video_files:
        import shutil
        webm_path = OUT_DIR / "agentos-screens-demo.webm"
        shutil.move(str(video_files[0]), str(webm_path))
        shutil.rmtree(screens_video_dir, ignore_errors=True)
    else:
        webm_path = OUT_DIR / "agentos-screens-demo.webm"
    if webm_path.exists():
        mp4_path = OUT_DIR / "agentos-screens-demo.mp4"
        if convert_to_mp4(webm_path, mp4_path):
            webm_path.unlink(missing_ok=True)
            print(f"  Saved: {mp4_path}")
        else:
            print(f"  Video saved as: {webm_path} (convert manually: ffmpeg -i {webm_path} -c:v libx264 {mp4_path})")
    else:
        print("  No video file found.")


def record_guided_tour_demo():
    """Record guided tour demo."""
    from playwright.sync_api import sync_playwright

    tour_video_dir = OUT_DIR / "tour_temp"
    os.makedirs(tour_video_dir, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
            record_video_dir=str(tour_video_dir),
            record_video_size={"width": 1440, "height": 900},
        )
        page = context.new_page()

        print("Recording guided tour demo...")
        print(f"  Loading {BASE_URL} ...")
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        time.sleep(2)

        page.evaluate(DISMISS_MODAL_JS)
        time.sleep(1.5)

        # Go to Settings
        page.evaluate(CLICK_SIDEBAR_BY_ID_JS, "settings")
        time.sleep(3)

        # Click "Restart Guided Tour"
        tour_clicked = page.evaluate("""
            () => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const target = buttons.find(b => b.textContent && b.textContent.includes('Restart Guided Tour'));
                if (target) { target.click(); return true; }
                return false;
            }
        """)
        if not tour_clicked:
            # Fallback: try "Guided Tour" text
            tour_clicked = page.evaluate("""
                () => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const target = buttons.find(b => b.textContent && b.textContent.includes('Guided Tour'));
                    if (target) { target.click(); return true; }
                    return false;
                }
            """)
        if not tour_clicked:
            print("  WARNING: Could not find Guided Tour button. Trying Help menu...")
            # Try clicking Help if it exists
            page.evaluate("""
                () => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const help = buttons.find(b => b.textContent && b.textContent.includes('Help'));
                    if (help) { help.click(); return true; }
                    return false;
                }
            """)
            time.sleep(1)
            page.evaluate("""
                () => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const tour = buttons.find(b => b.textContent && b.textContent.includes('Restart Guided Tour'));
                    if (tour) { tour.click(); return true; }
                    return false;
                }
            """)

        time.sleep(4)

        # Step through tour — click "Next" for each step (17 steps)
        for i in range(17):
            next_clicked = page.evaluate("""
                () => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const next = buttons.find(b => b.textContent && (b.textContent.includes('Next') || b.textContent.includes('Finish')));
                    if (next) { next.click(); return true; }
                    return false;
                }
            """)
            if next_clicked:
                time.sleep(5)  # Allow time to read each step
            else:
                break

        time.sleep(4)
        context.close()
        browser.close()

    video_files = list(tour_video_dir.glob("*.webm"))
    webm_path = OUT_DIR / "agentos-guided-tour-demo.webm"
    if video_files:
        import shutil
        shutil.move(str(video_files[0]), str(webm_path))
        shutil.rmtree(tour_video_dir, ignore_errors=True)
    if webm_path.exists():
        mp4_path = OUT_DIR / "agentos-guided-tour-demo.mp4"
        if convert_to_mp4(webm_path, mp4_path):
            webm_path.unlink(missing_ok=True)
            print(f"  Saved: {mp4_path}")
        else:
            print(f"  Video saved as: {webm_path} (convert manually: ffmpeg -i {webm_path} -c:v libx264 {mp4_path})")
    else:
        print("  No video file found.")


def main():
    print("AgentOS Demo Recorder")
    print("=" * 50)
    print("Ensure gateway (port 3000) and web (port 3010) are running.\n")

    arg = sys.argv[1] if len(sys.argv) > 1 else "--all"

    if arg == "--screenshots":
        take_screenshots()
    elif arg == "--demo":
        record_demo_video()
    elif arg == "--tour":
        record_guided_tour_demo()
    elif arg == "--screens-only":
        record_screens_demo()
    else:
        # --all: screenshots + demo video + tour video
        take_screenshots()
        print("")
        record_demo_video()
        print("")
        record_guided_tour_demo()

    print(f"\nDone. Outputs → {OUT_DIR}")


if __name__ == "__main__":
    main()
