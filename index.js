(() => {
  const LOCAL_BASE_URL = 'http://127.0.0.1:8080';
  const HEROKU_BASE_URL = 'https://internal-job-board-c77640affb70.herokuapp.com';
  const CLOUD_RUN_BASE_URL = 'https://internal-job-board-http-function-1085083463883.us-central1.run.app';
  const FETCH_ERROR_MESSAGE = 'Failed to fetch data from Greenhouse API.';

  function getDepartments(jobDepartments, jobPosts) {
    return jobDepartments.filter(({ id }) =>
      jobPosts.map(({ job: { department_id } }) => department_id).includes(id),
    );
  }

  const app = new Vue({
    el: 'main',
    BASE_URL: [
      LOCAL_BASE_URL,
      HEROKU_BASE_URL,
      CLOUD_RUN_BASE_URL,
    ][2],
    data() {
      return {
        jobPosts: JSON.parse(sessionStorage.getItem('jobPosts')) ?? [],
        jobDepartments: JSON.parse(sessionStorage.getItem('jobDepartments')) ?? [],
        departments: [],
        selectedDepartmentId: 0,
      };
    },
    computed: {
      jobPostsFiltered() {
        let { jobPosts } = this;
        try {
          jobPosts = jobPosts.filter(({ job: { department_id: departmentId } }) => [departmentId, 0].includes(+this.selectedDepartmentId));
        } catch {
          // `jobPosts` not initialized yet
          // TypeError: Cannot read properties of undefined (reading 'department_id')
        }
        return jobPosts;
      },
      jobPostsFilteredPerDepartment() {
        const res = Object.fromEntries(
          this.departments
            .map((department) => [
              department.name,
              this.jobPostsFiltered.filter(({ job: { department_id } }) => department_id === department.id),
            ])
            .filter(([, jobPosts]) => jobPosts.length),
        );
        return res;
      },
    },
    async created() {
      let response;

      if (!this.jobPosts.length) {
        response = await fetch(`${this.$options.BASE_URL}/job_posts`);
        if (!response.ok) throw new Error(FETCH_ERROR_MESSAGE);
        const jobPosts = await response.json();

        response = await fetch(`${this.$options.BASE_URL}/jobs`);
        if (!response.ok) throw new Error(FETCH_ERROR_MESSAGE);
        const jobs = await response.json();

        response = await fetch(`${this.$options.BASE_URL}/locations`);
        if (!response.ok) throw new Error(FETCH_ERROR_MESSAGE);
        const locations = await response.json();

        jobPosts.forEach((jobPost) => {
          jobPost.job = jobs.find(({ id }) => id === jobPost.job_id);
          jobPost.location = locations.find(({ job_post_id: jobPostId }) => jobPostId === jobPost.id);
        });

        this.jobPosts = jobPosts;
        sessionStorage.setItem('jobPosts', JSON.stringify(this.jobPosts));
      }

      if (!this.jobDepartments.length) {
        response = await fetch(`${this.$options.BASE_URL}/departments`);
        if (!response.ok) throw new Error(FETCH_ERROR_MESSAGE);
        this.jobDepartments = await response.json();

        sessionStorage.setItem('jobDepartments', JSON.stringify(this.jobDepartments));
      }

      this.departments = getDepartments(this.jobDepartments, this.jobPosts);
    },
  });
})();
