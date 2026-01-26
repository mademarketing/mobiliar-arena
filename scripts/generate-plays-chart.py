#!/usr/bin/env python3
"""
Generate a chart showing plays per 10-minute bucket for each day.

Usage:
    uv run --with matplotlib python3 scripts/generate-plays-chart.py
    uv run --with matplotlib python3 scripts/generate-plays-chart.py --start 2025-11-21 --end 2025-12-04
    uv run --with matplotlib python3 scripts/generate-plays-chart.py --output my-chart.png
"""

import sqlite3
import argparse
from datetime import datetime, timedelta
from collections import defaultdict
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


def get_date_label(date_str: str) -> str:
    """Convert date string to human-readable label with day of week."""
    dt = datetime.strptime(date_str, '%Y-%m-%d')
    day_name = dt.strftime('%a')
    if dt.month == 11:
        return f"{dt.day}. Nov ({day_name})"
    elif dt.month == 12:
        return f"{dt.day}. Dec ({day_name})"
    else:
        return f"{dt.day}. {dt.strftime('%b')} ({day_name})"


def main():
    parser = argparse.ArgumentParser(description='Generate plays per 10-minute bucket chart')
    parser.add_argument('--db', default='content/prizes.db', help='Path to prizes.db')
    parser.add_argument('--start', default='2025-11-21', help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end', default=None, help='End date (YYYY-MM-DD), defaults to yesterday')
    parser.add_argument('--output', '-o', default='plays_by_time.png', help='Output file path')
    args = parser.parse_args()

    # Default end date to yesterday
    if args.end is None:
        yesterday = datetime.now() - timedelta(days=1)
        args.end = yesterday.strftime('%Y-%m-%d')

    # Find database
    db_path = Path(args.db)
    if not db_path.exists():
        # Try relative to script location (scripts/ -> docker/app/server/content/)
        script_dir = Path(__file__).parent.parent
        db_path = script_dir / 'docker' / 'app' / 'server' / 'content' / 'prizes.db'

    if not db_path.exists():
        print(f"Error: Database not found at {db_path}")
        return 1

    print(f"Reading from: {db_path}")
    print(f"Date range: {args.start} to {args.end}")

    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Query plays in date range
    cursor.execute("""
        SELECT timestamp, date FROM play_log
        WHERE date >= ? AND date <= ?
        ORDER BY timestamp
    """, (args.start, args.end))

    # Group by date and 10-minute bucket (adjusting UTC to Swiss time +1h)
    data = defaultdict(lambda: defaultdict(int))

    for row in cursor.fetchall():
        ts = datetime.fromisoformat(row[0].replace('Z', '+00:00'))
        # Convert UTC to Swiss time (UTC+1)
        swiss_time = ts + timedelta(hours=1)
        date_str = swiss_time.strftime('%Y-%m-%d')

        # Create 10-minute bucket
        hour = swiss_time.hour
        minute_bucket = (swiss_time.minute // 10) * 10
        bucket = f"{hour:02d}:{minute_bucket:02d}"

        # Only count if within 10:00-20:00
        if 10 <= hour < 20:
            data[date_str][bucket] += 1

    conn.close()

    if not data:
        print("No data found for the specified date range")
        return 1

    # Generate all time buckets from 10:00 to 19:50
    all_buckets = []
    for h in range(10, 20):
        for m in range(0, 60, 10):
            all_buckets.append(f"{h:02d}:{m:02d}")

    # Create figure with subplots
    dates = sorted(data.keys())
    n_days = len(dates)
    fig, axes = plt.subplots(n_days, 1, figsize=(16, 3 * n_days), sharex=True)

    # Handle single day case
    if n_days == 1:
        axes = [axes]

    colors = plt.cm.tab20(np.linspace(0, 1, max(n_days, 2)))

    for idx, date in enumerate(dates):
        ax = axes[idx]
        counts = [data[date].get(bucket, 0) for bucket in all_buckets]
        total = sum(counts)

        # Create bar chart
        x = np.arange(len(all_buckets))
        ax.bar(x, counts, color=colors[idx], alpha=0.8, edgecolor='white', linewidth=0.5)

        # Add total count in title
        label = get_date_label(date)
        ax.set_ylabel('Plays', fontsize=10)
        ax.set_title(f'{label} — Total: {total} plays', fontsize=12, fontweight='bold', loc='left')

        # Set y-axis limit for consistency
        ax.set_ylim(0, 30)
        ax.grid(axis='y', alpha=0.3)
        ax.set_axisbelow(True)

        # Add horizontal lines at key values
        ax.axhline(y=10, color='gray', linestyle='--', alpha=0.3, linewidth=0.5)
        ax.axhline(y=20, color='gray', linestyle='--', alpha=0.3, linewidth=0.5)

    # Set x-axis labels (only show every hour)
    hour_indices = [i for i in range(0, len(all_buckets), 6)]
    hour_labels = [all_buckets[i] for i in hour_indices]
    axes[-1].set_xticks(hour_indices)
    axes[-1].set_xticklabels(hour_labels, fontsize=10)
    axes[-1].set_xlabel('Time (10-minute buckets)', fontsize=12)

    plt.suptitle('Flughafen Fee - Plays per 10-minute bucket (10:00-20:00)',
                 fontsize=14, fontweight='bold', y=1.002)
    plt.tight_layout()
    plt.savefig(args.output, dpi=150, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()

    print(f"Chart saved to: {args.output}")

    # Print summary
    total_plays = sum(sum(data[d].values()) for d in dates)
    print(f"\nSummary:")
    print(f"  Days: {n_days}")
    print(f"  Total plays: {total_plays}")
    for date in dates:
        day_total = sum(data[date].values())
        print(f"  {get_date_label(date)}: {day_total} plays")

    return 0


if __name__ == '__main__':
    exit(main())
