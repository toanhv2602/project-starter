import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'] },
  ...vue.configs['flat/recommended'],
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'error'
    }
  }
]
