# Third-party icons

The `.svg` files in this directory are vendored from
[tandpfun/skill-icons](https://github.com/tandpfun/skill-icons), unmodified.

They are copied into this repository on purpose. The upstream project also offers a
hosted renderer at `skillicons.dev`, but this profile deliberately serves every image
from the repo itself, so nothing on the page can be rate-limited, restyled or taken
away by a third party.

Only the icons this profile actually uses are vendored. To add one, drop the matching
file from upstream `icons/` into this folder and reference its slug in
`.github/scripts/readme-panels.mjs`.

---

MIT License

Copyright (c) 2022 Thijs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
