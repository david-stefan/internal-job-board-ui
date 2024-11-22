(() => {
  const LOCAL_BASE_URL = 'http://127.0.0.1:8080';
  const HEROKU_BASE_URL = 'https://internal-job-board-c77640affb70.herokuapp.com';
  const FETCH_ERROR_MESSAGE = 'Failed to fetch data from Greenhouse API.';

  const app = new Vue({
    el: 'main',
    BASE_URL: [
      LOCAL_BASE_URL,
      HEROKU_BASE_URL,
    ][0],
    inputTypes: {
      boolean: { tag: 'select', class: 'input' },
      long_text: { tag: 'textarea', class: 'textarea' },
      multi_select: { tag: 'select', class: 'input' },
      short_text: { tag: 'input', type: 'text', class: 'input' },
      single_select: { tag: 'select', class: 'input' },
    },
    data: {
      jobPost: null,
    },
    methods: {
      isCustomQuestion(name) {
        return name.match(/^question_\d+(\[\])?$/);
      },
      getInputTag(type) {
        return this.$options.inputTypes[type].tag;
      },
      getInputType(type, name) {
        const nameToType = {
          email: 'email',
          phone: 'tel',
        };
        return nameToType[name] || this.$options.inputTypes[type].type;
      },
      getInputClass(type) {
        return this.$options.inputTypes[type].class;
      },
    },
    async created() {
      const id = +(new URLSearchParams(window.location.search)).get('id');
      let jobPost = JSON.parse(sessionStorage.getItem('jobPosts'))?.find((jobPost) => jobPost.id === id);

      if (!jobPost) {
        const response = await fetch(`${this.$options.BASE_URL}/job_post?id=${id}`);
        if (!response.ok) throw new Error(FETCH_ERROR_MESSAGE);
        jobPost = await response.json();
      }

      this.jobPost = jobPost;
    },
    mounted() {
      try {
        this.$el.querySelectorAll('input[type="file"').forEach((fileInput) => {
          fileInput.addEventListener('change', (e) => {
            if (fileInput.files.length > 0) {
              const fileName = e.target.parentElement.querySelector('.file-name');
              fileName.textContent = fileInput.files[0].name;
            }
          })
        });
      } catch (error) {
        //
      }
    }
  });
})();
