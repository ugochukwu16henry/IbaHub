# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e5]
      - heading "Sign in to your account" [level=2] [ref=e7]
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: Email
          - textbox "Email" [ref=e13]:
            - /placeholder: Enter your email
            - text: test@test.com
        - generic [ref=e14]:
          - generic [ref=e15]: Password
          - textbox "Password" [ref=e17]:
            - /placeholder: Enter your password
            - text: admin123
        - generic [ref=e18]: Invalid email or password. Please try again.
        - button "Sign in" [ref=e20]
      - generic [ref=e21]:
        - generic [ref=e26]: New to our platform?
        - link "Create an account" [ref=e28] [cursor=pointer]:
          - /url: /sign-up
  - button "Open Next.js Dev Tools" [ref=e34] [cursor=pointer]:
    - img [ref=e35]
  - alert [ref=e38]
```