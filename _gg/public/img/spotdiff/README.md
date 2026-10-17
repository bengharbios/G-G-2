# Spot-the-Difference Images

7,005 images across 6 categories, extracted from flashi.me/f10/diff
and compressed PNG → JPEG (quality 80) for local hosting.

## Categories
| Category | Count | Path |
|----------|-------|------|
| photo | 1,499 | `images/photo/` |
| vmisc | 4,841 | `images/vmisc/` |
| vscenes | 525 | `images/vscenes/` |
| vphoto | 98 | `images/vphoto/` |
| photo3 | 23 | `images/photo3/` |
| vector3 | 19 | `images/vector3/` |
| **Total** | **7,005** | |

## Filename Format
Each filename encodes difference coordinates: `top1zleft1xtop2zleft2y...`
- Split by `y` → each part is one difference
- Each part: split by `x` → [topStr, leftStr]
- Replace `z` with `.` for decimal vmin coordinates
- Image B (bottom) is shifted down by 53.9 vmin

## Catalog
- `catalog/*.json` — JSON arrays with full metadata per category
- `catalog/_all_images_flat.json` — flat list of all 7,005 images
- `catalog/_summary.json` — summary statistics
