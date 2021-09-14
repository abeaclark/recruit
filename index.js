import { Octokit } from "@octokit/rest"
import fs from 'fs'
import stringify from 'csv-stringify'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
})

const searchRepos = term => {
  const q = term
  return octokit.rest.search.repos({ q, per_page: 30, sort: 'stars', order: 'desc' })
}

const nestedUserLists = listOfUsers => {
  // end up with list of lists
  // inner lists where each item is the value for a key
  const labels = ['login','id','node_id','avatar_url','gravatar_id','url','html_url','followers_url','following_url','gists_url','starred_url','subscriptions_url','organizations_url','repos_url','events_url','received_events_url','type','site_admin','name','company','blog','location','email','hireable','bio','twitter_username','public_repos','public_gists','followers','following','created_at','updated_at']
  const parent = [labels]
  listOfUsers.forEach(u => {
    const flattened = []
    labels.forEach(l => {
      flattened.push(u[l] || '')
    })
    parent.push(flattened)
  })
  return parent
}

const writeCSV = (csv, filename) => {
  fs.writeFile(filename, csv, function (err) {
    if (err) return console.log(err);
    console.log(`csv > ${filename}`);
  });
}

const getCandidateCSV = searchTerm => {
  const candidates = [];
  searchRepos(searchTerm)
  .then(res => {
    const resultNodes = res.data.items
    const contributorRequests = []
    resultNodes.forEach(r => {
      const request = octokit.rest.repos.listContributors({
        owner: r.owner.login,
        repo: r.name,
        per_page: 30,
      })
      contributorRequests.push(request)
    })
    return Promise.all(contributorRequests)
  })
  .then(contributorResponses => {
    // get full data by requesting actual usuer info
    const userRequests = []
    contributorResponses.forEach(r => {
      console.log(r.data);
      (r.data || []).forEach(c => {
        const userRequest = octokit.rest.users.getByUsername({
          username: c.login,
        })
        userRequests.push(userRequest)
      })
    })
    return Promise.all(userRequests)
  })
  .then(userResponses => {
    const candidates = []
    userResponses.forEach(r => {
      candidates.push(r.data)
    })
    const nestedArrays = nestedUserLists(candidates)
    stringify(nestedArrays, function(err, output) {
      writeCSV(output, `${searchTerm}.csv`)
    });
  })
}

getCandidateCSV(process.argv[2])
