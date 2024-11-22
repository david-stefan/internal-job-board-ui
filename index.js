(() => {
  const LOCAL_BASE_URL = 'http://127.0.0.1:8080';
  const HEROKU_BASE_URL = 'https://internal-job-board-c77640affb70.herokuapp.com';
  const FETCH_ERROR_MESSAGE = 'Failed to fetch data from Greenhouse API.';

  function uniqById(array) {
    const seen = new Map();
    return array.reduce((unique, item) => {
      if (!seen.has(item.id)) {
        seen.set(item.id, true);
        unique.push(item);
      }
      return unique;
    }, []);
  }

  const app = new Vue({
    el: 'main',
    BASE_URL: [
      LOCAL_BASE_URL,
      HEROKU_BASE_URL,
    ][1],
    data: {
      jobPosts: JSON.parse(sessionStorage.getItem('jobPosts')) ?? [],
      departments: [],
      selectedDepartmentId: 0,
      offices: [],
      selectedOfficeId: 0,
    },
    computed: {
      jobPostsFiltered() {
        let jobPosts = this.jobPosts;
        jobPosts = jobPosts.filter(({ job: { departments } }) => departments.some(({ id }) => [id, 0].includes(+this.selectedDepartmentId)));
        jobPosts = jobPosts.filter(({ job: { offices } }) => offices.some(({ id }) => [id, 0].includes(+this.selectedOfficeId)));
        return jobPosts;
      },
    },
    async created() {
      if (!this.jobPosts.length) {
        let jobPosts;
        const response = await fetch(this.$options.BASE_URL);
        if (!response.ok) throw new Error(FETCH_ERROR_MESSAGE);
        jobPosts = await response.json();

        const jobs = await Promise.all(jobPosts.map(async ({ job_id }) => {
          const response = await fetch(`${this.$options.BASE_URL}/job?id=${job_id}`);
          if (!response.ok) throw new Error(FETCH_ERROR_MESSAGE);
          return response.json();
        }));

        jobPosts = jobPosts.map((jobPost, index) => ({
          ...jobPost,
          job: jobs[index],
        }));

        sessionStorage.setItem('jobPosts', JSON.stringify(jobPosts));
        this.jobPosts = jobPosts;
      }

      this.departments = uniqById(this.jobPosts.map(({ job: { departments } }) => departments.map(({ id, name }) => ({ id, name }))).flat());
      this.offices = uniqById(this.jobPosts.map(({ job: { offices } }) => offices.map(({ id, name }) => ({ id, name }))).flat());
    },
  });
})();
