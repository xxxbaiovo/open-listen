<script>
  import Header from './Header.svelte'
  import List from './List.svelte'
  let filter = $state('')
  // console.log(params)
</script>

<div class="container">
  <Header bind:filter />
  <List {filter} />
</div>

<style lang="less">
  .container {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    min-height: 0;
    overflow: hidden;
  }
</style>
