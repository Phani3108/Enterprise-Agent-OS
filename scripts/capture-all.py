#!/usr/bin/env python3
"""
Capture comprehensive screenshots + record simulation demo for AgentOS README.

Produces:
  1. docs/screenshots/*.png — Updated screenshots for all platform screens
  2. docs/screenshots/engineering-*.png — Engineering Hub carousel steps
  3. docs/screenshots/product-*.png — Product Hub carousel steps
  4. docs/screenshots/marketing-*.png — Marketing Hub carousel steps
  5. docs/screenshots/simulation-*.png — Simulation platform screenshots
  6. demos/agentos-simulation-demo.mp4 — Demo video with simulation running

Requires: playwright, ffmpeg
Ensure gateway (port 3000) and web (port 3010) are running.
"""

import os
import sys
import time
import subprocess
import shutil
from pathlib import Path

BASE_URL = "http://localhost:3010"
GATEWAY  = "http://localhost:3000"
SS_DIR   = Path(__file__).resolve().parent.parent / "docs" / "screenshots"
DEMO_DIR = Path(__file__).resolve().parent.parent / "demos"
os.makedirs(SS_DIR, exist_ok=True)
os.makedirs(DEMO_DIR, exist_ok=True)

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

CLICK_SIDEBAR_JS = """
(sectionId) => {
    const el = document.querySelector('[data-tour="sidebar-' + sectionId + '"]');
    if (el) { el.click(); return true; }
    // fallback: match by text content in sidebar buttons
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find(b => b.textContent && b.textContent.trim().includes(sectionId));
    if (target) { target.click(); return true; }
    return false;
}
"""

CLICK_BUTTON_BY_TEXT_JS = """
(label) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find(b => b.textContent && b.textContent.trim().includes(label));
    if (target) { target.click(); return target.textContent.trim().substring(0, 40); }
    return null;
}
"""

CLICK_MARKETING_NAV_JS = """
(label) => {
    const module = document.querySelector('[data-tour="marketing-module"]');
    if (!module) {
        // fallback: search all buttons
        const buttons = Array.from(document.querySelectorAll('button'));
        const target = buttons.find(b => b.textContent && b.textContent.trim().includes(label));
        if (target) { target.click(); return target.textContent.trim().substring(0, 40); }
        return null;
    }
    const buttons = Array.from(module.querySelectorAll('button'));
    const target = buttons.find(b => b.textContent && b.textContent.trim().includes(label));
    if (target) { target.click(); return target.textContent.trim().substring(0, 40); }
    return null;
}
"""


def take_all_screenshots():
    """Capture all platform screens + persona carousels + simulation screenshots."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
        )
        page = ctx.new_page()

        print("=" * 60)
        print("CAPTURING SCREENSHOTS")
        print("=" * 60)
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        time.sleep(3)
        page.evaluate(DISMISS_MODAL_JS)
        time.sleep(1)

        def ss(name):
            path = str(SS_DIR / name)
            page.screenshot(path=path)
            print(f"  📸 {name}")

        def nav(sid, dwell=1.5):
            page.evaluate(DISMISS_MODAL_JS)
            page.evaluate(CLICK_SIDEBAR_JS, sid)
            time.sleep(dwell)
            page.evaluate(DISMISS_MODAL_JS)
            time.sleep(0.3)

        # ── Core Platform Screens ──────────────────────────────────────
        print("\n[Core Platform]")
        ss("01-home-command-center.png")
        nav("personas");      ss("02-personas.png")
        nav("marketplace");   ss("03-skill-marketplace.png")
        nav("builder");       ss("04-skill-builder.png")
        nav("agents");        ss("05-agents.png")
        nav("workflows");     ss("06-workflows.png")
        nav("tools");         ss("07-tools-registry.png")
        nav("prompts");       ss("08-prompt-library.png")
        nav("knowledge");     ss("09-knowledge-explorer.png")
        nav("control");       ss("10-control-plane.png")
        nav("memory");        ss("11-memory-graph.png")
        nav("acp");           ss("12-agent-collaboration.png")
        nav("governance");    ss("13-governance.png")
        nav("observability"); ss("14-observability.png")
        nav("learning");      ss("15-learning-hub.png")
        nav("scheduler");     ss("16-scheduler.png")
        nav("settings");      ss("17-settings.png")

        # ── ENGINEERING HUB CAROUSEL ───────────────────────────────────
        # All persona hubs use UnifiedPersonaLayout: Skills → Outputs → Programs → Memory
        print("\n[Engineering Hub Carousel]")
        nav("ws-engineering", dwell=2.5)
        ss("engineering-01-skills.png")

        # Click Outputs tab
        try:
            page.evaluate("""() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const t = buttons.find(b => b.textContent && b.textContent.includes('📦') && b.textContent.includes('Outputs'));
                if (t) { t.click(); return true; }
                const t2 = buttons.find(b => b.textContent && b.textContent.trim() === 'Outputs');
                if (t2) { t2.click(); return true; }
                return false;
            }""")
            time.sleep(2)
            ss("engineering-02-outputs.png")
        except Exception:
            pass

        # Click Programs tab
        try:
            page.evaluate("""() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const t = buttons.find(b => b.textContent && b.textContent.includes('📋') && b.textContent.includes('Programs'));
                if (t) { t.click(); return true; }
                const t2 = buttons.find(b => b.textContent && b.textContent.trim() === 'Programs');
                if (t2) { t2.click(); return true; }
                return false;
            }""")
            time.sleep(2)
            ss("engineering-03-programs.png")
        except Exception:
            pass

        # Click Memory tab
        try:
            page.evaluate("""() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const t = buttons.find(b => b.textContent && b.textContent.includes('🧠') && b.textContent.includes('Memory'));
                if (t) { t.click(); return true; }
                const t2 = buttons.find(b => b.textContent && b.textContent.trim() === 'Memory');
                if (t2) { t2.click(); return true; }
                return false;
            }""")
            time.sleep(2)
            ss("engineering-04-memory.png")
        except Exception:
            pass

        # Click first skill card from Skills tab
        try:
            page.evaluate("""() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const t = buttons.find(b => b.textContent && b.textContent.includes('⚡') && b.textContent.includes('Skills'));
                if (t) { t.click(); return true; }
                return false;
            }""")
            time.sleep(1.5)
            page.click(".grid button:first-child", timeout=4000)
            time.sleep(2)
            ss("engineering-05-skill-form.png")

            # Enable simulation
            try:
                page.evaluate("""() => {
                    const labels = Array.from(document.querySelectorAll('label'));
                    const simLabel = labels.find(l => l.textContent && l.textContent.includes('Simulation mode'));
                    if (simLabel) {
                        const checkbox = simLabel.querySelector('input[type="checkbox"]');
                        if (checkbox && !checkbox.checked) { checkbox.click(); }
                        return true;
                    }
                    return false;
                }""")
                time.sleep(0.5)
                ss("engineering-06-simulation-mode.png")
            except Exception:
                pass

            try:
                page.click("text=Cancel", timeout=2000)
            except Exception:
                pass
            time.sleep(0.5)
        except Exception:
            pass

        # ── Execution screen for Engineering ───────────────────────────
        print("\n[Engineering Execution / Simulation]")
        nav("exec-engineering", dwell=2.5)
        ss("simulation-engineering-01-skills.png")

        # Select first available skill
        try:
            page.click(".grid button:first-child", timeout=4000)
            time.sleep(2)
            ss("simulation-engineering-02-configure.png")

            # Enable simulation mode
            try:
                # Find and check the simulation checkbox
                page.evaluate("""
                    () => {
                        const labels = Array.from(document.querySelectorAll('label'));
                        const simLabel = labels.find(l => l.textContent && l.textContent.includes('Simulation mode'));
                        if (simLabel) {
                            const checkbox = simLabel.querySelector('input[type="checkbox"]');
                            if (checkbox && !checkbox.checked) { checkbox.click(); }
                            return true;
                        }
                        return false;
                    }
                """)
                time.sleep(0.5)
                ss("simulation-engineering-03-sim-enabled.png")
            except Exception:
                pass

            # Click Run/Simulate button
            try:
                result = page.evaluate("""
                    () => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const run = buttons.find(b => b.textContent && (b.textContent.includes('Simulate') || b.textContent.includes('Run')));
                        if (run && !run.disabled) { run.click(); return run.textContent.trim(); }
                        return null;
                    }
                """)
                if result:
                    time.sleep(3)
                    ss("simulation-engineering-04-running.png")
                    # Wait for completion
                    time.sleep(8)
                    ss("simulation-engineering-05-completed.png")
            except Exception:
                pass
        except Exception:
            pass

        # ── PRODUCT HUB CAROUSEL ───────────────────────────────────────
        print("\n[Product Hub Carousel]")
        nav("ws-product", dwell=2.5)
        ss("product-01-skills.png")

        # Click Outputs tab
        try:
            page.evaluate("""() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const t = buttons.find(b => b.textContent && b.textContent.includes('📦') && b.textContent.includes('Outputs'));
                if (t) { t.click(); return true; }
                const t2 = buttons.find(b => b.textContent && b.textContent.trim() === 'Outputs');
                if (t2) { t2.click(); return true; }
                return false;
            }""")
            time.sleep(2)
            ss("product-02-outputs.png")
        except Exception:
            pass

        # Click Programs tab
        try:
            page.evaluate("""() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const t = buttons.find(b => b.textContent && b.textContent.includes('📋') && b.textContent.includes('Programs'));
                if (t) { t.click(); return true; }
                const t2 = buttons.find(b => b.textContent && b.textContent.trim() === 'Programs');
                if (t2) { t2.click(); return true; }
                return false;
            }""")
            time.sleep(2)
            ss("product-03-programs.png")
        except Exception:
            pass

        # Click Memory tab
        try:
            page.evaluate("""() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const t = buttons.find(b => b.textContent && b.textContent.includes('🧠') && b.textContent.includes('Memory'));
                if (t) { t.click(); return true; }
                const t2 = buttons.find(b => b.textContent && b.textContent.trim() === 'Memory');
                if (t2) { t2.click(); return true; }
                return false;
            }""")
            time.sleep(2)
            ss("product-04-memory.png")
        except Exception:
            pass

        # Click first skill card from Skills tab
        try:
            page.evaluate("""() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const t = buttons.find(b => b.textContent && b.textContent.includes('⚡') && b.textContent.includes('Skills'));
                if (t) { t.click(); return true; }
                return false;
            }""")
            time.sleep(1.5)
            page.click(".grid button:first-child", timeout=4000)
            time.sleep(2)
            ss("product-05-skill-form.png")

            # Enable simulation
            try:
                page.evaluate("""() => {
                    const labels = Array.from(document.querySelectorAll('label'));
                    const simLabel = labels.find(l => l.textContent && l.textContent.includes('Simulation mode'));
                    if (simLabel) {
                        const checkbox = simLabel.querySelector('input[type="checkbox"]');
                        if (checkbox && !checkbox.checked) { checkbox.click(); }
                        return true;
                    }
                    return false;
                }""")
                time.sleep(0.5)
                ss("product-06-simulation-mode.png")
            except Exception:
                pass

            try:
                page.click("text=Cancel", timeout=2000)
            except Exception:
                pass
            time.sleep(0.5)
        except Exception:
            pass

        # ── Execution screen for Product ───────────────────────────────
        print("\n[Product Execution / Simulation]")
        nav("exec-product", dwell=2.5)
        ss("simulation-product-01-skills.png")

        try:
            page.click(".grid button:first-child", timeout=4000)
            time.sleep(2)
            ss("simulation-product-02-configure.png")

            page.evaluate("""
                () => {
                    const labels = Array.from(document.querySelectorAll('label'));
                    const simLabel = labels.find(l => l.textContent && l.textContent.includes('Simulation mode'));
                    if (simLabel) {
                        const checkbox = simLabel.querySelector('input[type="checkbox"]');
                        if (checkbox && !checkbox.checked) { checkbox.click(); }
                        return true;
                    }
                    return false;
                }
            """)
            time.sleep(0.5)

            result = page.evaluate("""
                () => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const run = buttons.find(b => b.textContent && (b.textContent.includes('Simulate') || b.textContent.includes('Run')));
                    if (run && !run.disabled) { run.click(); return run.textContent.trim(); }
                    return null;
                }
            """)
            if result:
                time.sleep(3)
                ss("simulation-product-03-running.png")
                time.sleep(8)
                ss("simulation-product-04-completed.png")
        except Exception:
            pass

        # ── MARKETING HUB CAROUSEL ─────────────────────────────────────
        # All persona hubs use UnifiedPersonaLayout with 4 tabs: Skills, Outputs, Programs, Memory
        print("\n[Marketing Hub Carousel]")
        nav("ws-marketing", dwell=2.5)
        ss("marketing-01-skills.png")

        # Click Outputs tab
        try:
            page.evaluate("""
                () => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const target = buttons.find(b => b.textContent && b.textContent.includes('Outputs') && b.textContent.includes('📦'));
                    if (target) { target.click(); return true; }
                    // fallback
                    const t2 = buttons.find(b => b.textContent && b.textContent.trim() === 'Outputs');
                    if (t2) { t2.click(); return true; }
                    return false;
                }
            """)
            time.sleep(2)
            ss("marketing-02-outputs.png")
        except Exception:
            pass

        # Click Programs tab
        try:
            page.evaluate("""
                () => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const target = buttons.find(b => b.textContent && b.textContent.includes('Programs') && b.textContent.includes('📋'));
                    if (target) { target.click(); return true; }
                    const t2 = buttons.find(b => b.textContent && b.textContent.trim() === 'Programs');
                    if (t2) { t2.click(); return true; }
                    return false;
                }
            """)
            time.sleep(2)
            ss("marketing-03-programs.png")
        except Exception:
            pass

        # Click Memory tab
        try:
            page.evaluate("""
                () => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const target = buttons.find(b => b.textContent && b.textContent.includes('Memory') && b.textContent.includes('🧠'));
                    if (target) { target.click(); return true; }
                    const t2 = buttons.find(b => b.textContent && b.textContent.trim() === 'Memory');
                    if (t2) { t2.click(); return true; }
                    return false;
                }
            """)
            time.sleep(2)
            ss("marketing-04-memory.png")
        except Exception:
            pass

        # Click first skill card to show skill form
        try:
            page.evaluate("""
                () => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const target = buttons.find(b => b.textContent && b.textContent.includes('Skills') && b.textContent.includes('⚡'));
                    if (target) { target.click(); return true; }
                    return false;
                }
            """)
            time.sleep(1.5)
            page.click(".grid button:first-child", timeout=4000)
            time.sleep(2)
            ss("marketing-05-skill-form.png")
            # Enable simulation toggle
            page.evaluate("""
                () => {
                    const labels = Array.from(document.querySelectorAll('label'));
                    const simLabel = labels.find(l => l.textContent && l.textContent.includes('Simulation mode'));
                    if (simLabel) {
                        const checkbox = simLabel.querySelector('input[type="checkbox"]');
                        if (checkbox && !checkbox.checked) { checkbox.click(); }
                        return true;
                    }
                    return false;
                }
            """)
            time.sleep(0.5)
            ss("marketing-06-simulation-mode.png")
            try:
                page.click("text=Cancel", timeout=2000)
            except Exception:
                pass
        except Exception:
            pass

        # ── Marketing Execution/Simulation ─────────────────────────────
        print("\n[Marketing Execution / Simulation]")
        nav("exec-marketing", dwell=2.5)
        ss("simulation-marketing-01-skills.png")

        try:
            page.click(".grid button:first-child", timeout=4000)
            time.sleep(2)
            ss("simulation-marketing-02-configure.png")

            page.evaluate("""
                () => {
                    const labels = Array.from(document.querySelectorAll('label'));
                    const simLabel = labels.find(l => l.textContent && l.textContent.includes('Simulation mode'));
                    if (simLabel) {
                        const checkbox = simLabel.querySelector('input[type="checkbox"]');
                        if (checkbox && !checkbox.checked) { checkbox.click(); }
                        return true;
                    }
                    return false;
                }
            """)
            time.sleep(0.5)

            result = page.evaluate("""
                () => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const run = buttons.find(b => b.textContent && (b.textContent.includes('Simulate') || b.textContent.includes('Run')));
                    if (run && !run.disabled) { run.click(); return run.textContent.trim(); }
                    return null;
                }
            """)
            if result:
                time.sleep(3)
                ss("simulation-marketing-03-running.png")
                time.sleep(8)
                ss("simulation-marketing-04-completed.png")
        except Exception:
            pass

        ctx.close()
        browser.close()

    count = len(list(SS_DIR.glob("*.png")))
    print(f"\n✅ {count} screenshots saved → {SS_DIR}\n")


def convert_to_mp4(webm_path: Path, mp4_path: Path) -> bool:
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


def record_simulation_demo():
    """
    Record demo video showing simulation running on Engineering persona.
    Home → Engineering Hub → Pick skill → Enable simulation → Run → Watch timeline → Output.
    """
    from playwright.sync_api import sync_playwright

    video_dir = DEMO_DIR / "sim_raw"
    os.makedirs(video_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1440, "height": 900},
            record_video_dir=str(video_dir),
            record_video_size={"width": 1440, "height": 900},
        )
        page = ctx.new_page()
        print("=" * 60)
        print("RECORDING SIMULATION DEMO")
        print("=" * 60)

        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        time.sleep(3)
        page.evaluate(DISMISS_MODAL_JS)
        time.sleep(2)

        # (0:00–0:05) Home — show the platform
        print("  [0:00] Home Command Center")
        time.sleep(5)

        # (0:05–0:10) Navigate to personas
        print("  [0:05] Personas overview")
        page.evaluate(CLICK_SIDEBAR_JS, "personas")
        time.sleep(5)

        # (0:10–0:18) Engineering Hub
        print("  [0:10] Engineering Hub")
        page.evaluate(CLICK_SIDEBAR_JS, "ws-engineering")
        time.sleep(4)
        # Browse the skill grid
        time.sleep(4)

        # (0:18–0:25) Product Hub
        print("  [0:18] Product Hub")
        page.evaluate(CLICK_SIDEBAR_JS, "ws-product")
        time.sleep(4)
        time.sleep(3)

        # (0:25–0:35) Marketing Hub
        print("  [0:25] Marketing Hub")
        page.evaluate(CLICK_SIDEBAR_JS, "ws-marketing")
        time.sleep(5)
        # Show command center
        page.evaluate(CLICK_MARKETING_NAV_JS, "Command Center")
        time.sleep(3)
        # Show Campaign Pipeline
        page.evaluate(CLICK_MARKETING_NAV_JS, "Campaign Pipeline")
        time.sleep(3)

        # (0:35–1:40) Run a simulation on Engineering
        print("  [0:35] Starting Engineering simulation...")
        page.evaluate(CLICK_SIDEBAR_JS, "exec-engineering")
        time.sleep(4)

        # Pick first skill
        try:
            page.click(".grid button:first-child", timeout=5000)
            time.sleep(3)
            print("  [0:42] Configuring skill...")

            # Enable simulation
            page.evaluate("""
                () => {
                    const labels = Array.from(document.querySelectorAll('label'));
                    const simLabel = labels.find(l => l.textContent && l.textContent.includes('Simulation mode'));
                    if (simLabel) {
                        const checkbox = simLabel.querySelector('input[type="checkbox"]');
                        if (checkbox && !checkbox.checked) { checkbox.click(); }
                        return true;
                    }
                    return false;
                }
            """)
            time.sleep(2)
            print("  [0:44] Simulation mode enabled")

            # Click Run
            page.evaluate("""
                () => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const run = buttons.find(b => b.textContent && (b.textContent.includes('Simulate') || b.textContent.includes('Run')));
                    if (run && !run.disabled) { run.click(); return true; }
                    return false;
                }
            """)
            print("  [0:46] Execution started — watching timeline...")
            time.sleep(15)  # Watch the execution progress
            print("  [1:01] Execution completing...")
            time.sleep(10)
            time.sleep(5)
            print("  [1:16] Viewing output...")
            time.sleep(5)
        except Exception as e:
            print(f"  ⚠️ Could not run simulation: {e}")
            time.sleep(5)

        # (1:40–2:00) Quick tour of platform screens
        print("  [1:40] Quick platform tour...")
        for sid, dwell in [
            ("agents", 4), ("workflows", 4), ("control", 4),
            ("memory", 4), ("observability", 4), ("governance", 4)
        ]:
            page.evaluate(CLICK_SIDEBAR_JS, sid)
            time.sleep(dwell)

        # End on home
        page.evaluate(CLICK_SIDEBAR_JS, "home")
        time.sleep(4)

        print("  [2:00] Done recording")
        ctx.close()
        browser.close()

    # Convert
    webms = sorted(video_dir.glob("*.webm"), key=lambda f: f.stat().st_mtime, reverse=True)
    if webms:
        raw = webms[0]
        mp4_path = DEMO_DIR / "agentos-simulation-demo.mp4"
        print(f"\n  Converting to mp4...")
        if convert_to_mp4(raw, mp4_path):
            shutil.rmtree(video_dir, ignore_errors=True)
            size = mp4_path.stat().st_size / 1_048_576
            print(f"  ✅ {mp4_path}  ({size:.1f} MB)")
        else:
            # Keep raw webm
            dest = DEMO_DIR / "agentos-simulation-demo.webm"
            shutil.move(str(raw), str(dest))
            shutil.rmtree(video_dir, ignore_errors=True)
            print(f"  ⚠️  Saved as webm: {dest}")
    else:
        print("  ⚠️  No video file found")


def main():
    print("\nAgentOS — Screenshot & Demo Capture")
    print("=" * 60)
    print(f"Web: {BASE_URL}  |  Gateway: {GATEWAY}\n")

    arg = sys.argv[1] if len(sys.argv) > 1 else "--all"

    if arg == "--screenshots":
        take_all_screenshots()
    elif arg == "--demo":
        record_simulation_demo()
    else:
        take_all_screenshots()
        print("")
        record_simulation_demo()

    print(f"\nDone! Screenshots → {SS_DIR} | Demos → {DEMO_DIR}")


if __name__ == "__main__":
    main()
